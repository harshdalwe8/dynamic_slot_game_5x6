import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  getActivePaymentLinks,
  initDeposit,
  uploadDepositScreenshot,
  getMyDeposits,
  DepositInfo,
  PaymentLinkOption,
} from '../services/playerApi';

type DepositStep = 'selectAmount' | 'payment' | 'uploadScreenshot' | 'success';

const DepositPage: React.FC = () => {
  const [step, setStep] = useState<DepositStep>('selectAmount');
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkOption[]>([]);
  const [myDeposits, setMyDeposits] = useState<DepositInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedLink, setSelectedLink] = useState<PaymentLinkOption | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [currentDeposit, setCurrentDeposit] = useState<any>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [linksRes, depositsRes] = await Promise.all([
        getActivePaymentLinks(),
        getMyDeposits(),
      ]);
      setPaymentLinks(linksRes.paymentLinks);
      setMyDeposits(depositsRes.deposits);
      
      // Automatically select the first payment link if available
      if (linksRes.paymentLinks.length > 0 && !selectedLink) {
        setSelectedLink(linksRes.paymentLinks[0]);
      }
      
      setError('');
    } catch (err: any) {
      setError('Failed to load payment links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(parseInt(value) || null);
    } else {
      setSelectedAmount(null);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedLink) {
      setError('Please select a payment link');
      return;
    }

    if (!selectedAmount) {
      setError('Please select an amount');
      return;
    }

    try {
      setLoading(true);
      const response = await initDeposit(selectedLink.id, selectedAmount * 100); // Convert to cents
      setCurrentDeposit(response);
      setStep('payment');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate payment link');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setScreenshotFile(file);
      setError('');
    }
  };

  const handleUploadScreenshot = async () => {
    if (!screenshotFile || !currentDeposit) {
      setError('Please select a screenshot');
      return;
    }

    try {
      setUploading(true);
      // In production, this would upload to cloud storage
      // For now, we'll create a local URL
      const screenshotUrl = URL.createObjectURL(screenshotFile);
      
      await uploadDepositScreenshot(currentDeposit.depositId, screenshotUrl);
      
      setStep('uploadScreenshot');
      setSuccess('Screenshot uploaded successfully! Your deposit is pending admin approval.');
      setError('');
      
      // Refresh deposits
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchInitialData();
      
      setTimeout(() => {
        resetForm();
        setStep('selectAmount');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload screenshot');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedLink(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setCurrentDeposit(null);
    setScreenshotFile(null);
    setStep('selectAmount');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading && step === 'selectAmount') {
    return (
      <Container>
        <LoadingMessage>Loading payment options...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>💳 Deposit Funds</Title>
        <Subtitle>Quick and secure UPI deposits</Subtitle>
      </Header>

      {error && (
        <AlertBox $type="error">
          <AlertIcon>⚠️</AlertIcon>
          {error}
        </AlertBox>
      )}

      {success && (
        <AlertBox $type="success">
          <AlertIcon>✓</AlertIcon>
          {success}
        </AlertBox>
      )}

      {/* Step 1: Select Amount */}
      {step === 'selectAmount' && (
        <ContentCard>
          <StepTitle>Step 1: Select Payment Method & Amount</StepTitle>

          {/* Payment Link Selection */}
          <FormSection>
            <Label>Select Payment Link *</Label>
            <LinkOptions>
              {paymentLinks.length === 0 ? (
                <EmptyMessage>No payment links available. Please try again later.</EmptyMessage>
              ) : (
                paymentLinks.map((link) => (
                  <LinkOption
                    key={link.id}
                    $selected={selectedLink?.id === link.id}
                    onClick={() => {
                      setSelectedLink(link);
                      setError('');
                    }}
                  >
                    <LinkName>{link.name}</LinkName>
                    <LinkVPA>{link.payeeVPA}</LinkVPA>
                  </LinkOption>
                ))
              )}
            </LinkOptions>
          </FormSection>

          {/* Amount Selection */}
          {selectedLink && (
            <FormSection>
              <Label>Select Amount *</Label>
              <AmountButtonGrid>
                {PRESET_AMOUNTS.map((amount) => (
                  <AmountButton
                    key={amount}
                    $selected={selectedAmount === amount}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    ₹{amount}
                  </AmountButton>
                ))}
              </AmountButtonGrid>

              <OrDivider>OR</OrDivider>

              <CustomAmountSection>
                <Label>Enter Custom Amount</Label>
                <CustomInput
                  type="number"
                  min="1"
                  placeholder="Enter amount in ₹"
                  value={customAmount}
                  onChange={handleCustomAmount}
                />
              </CustomAmountSection>

              <ProceedButton onClick={handleGenerateLink} disabled={!selectedAmount || loading}>
                {loading ? 'Processing...' : 'Generate Payment Link →'}
              </ProceedButton>
            </FormSection>
          )}
        </ContentCard>
      )}

      {/* Step 2: Show Payment Link */}
      {step === 'payment' && currentDeposit && (
        <ContentCard>
          <StepTitle>Step 2: Make Payment via UPI</StepTitle>

          <PaymentDetailsBox>
            <PaymentDetailItem>
              <DetailLabel>Amount:</DetailLabel>
              <DetailValue>₹{(currentDeposit.amount / 100).toFixed(2)}</DetailValue>
            </PaymentDetailItem>

            <PaymentDetailItem>
              <DetailLabel>Transaction ID:</DetailLabel>
              <DetailValueWithCopy>
                <code>{currentDeposit.transactionRef}</code>
                <CopyButton onClick={() => copyToClipboard(currentDeposit.transactionRef)}>
                  📋 Copy
                </CopyButton>
              </DetailValueWithCopy>
            </PaymentDetailItem>

            <PaymentDetailItem>
              <DetailLabel>Recipient:</DetailLabel>
              <DetailValue>{currentDeposit.payeeInfo.name}</DetailValue>
            </PaymentDetailItem>

            <PaymentDetailItem>
              <DetailLabel>UPI ID:</DetailLabel>
              <DetailValue>{currentDeposit.payeeInfo.vpa}</DetailValue>
            </PaymentDetailItem>
          </PaymentDetailsBox>

          <PaymentInstructions>
            <InstructionTitle>📱 How to Pay:</InstructionTitle>
            <InstructionList>
              <li>Click the "Pay with UPI" button below</li>
              <li>Select your preferred UPI app (Google Pay, PhonePe, etc.)</li>
              <li>Verify the amount and recipient</li>
              <li>Complete the payment</li>
              <li>Return here to upload the payment screenshot</li>
            </InstructionList>
          </PaymentInstructions>

          <PaymentLinks>
            <UPIButton onClick={() => window.location.href = currentDeposit.upiLink}>
              🔗 Pay with UPI
            </UPIButton>
            <ManualButton onClick={() => setStep('uploadScreenshot')}>
              Already Paid? → Upload Screenshot
            </ManualButton>
          </PaymentLinks>

          <BackButton onClick={resetForm}>← Back to Select Amount</BackButton>
        </ContentCard>
      )}

      {/* Step 3: Upload Screenshot */}
      {step === 'uploadScreenshot' && currentDeposit && (
        <ContentCard>
          <StepTitle>Step 3: Upload Payment Screenshot</StepTitle>

          <UploadSection>
            <UploadPrompt>
              Please upload a screenshot of your successful payment confirmation.
            </UploadPrompt>

            <FileInputWrapper>
              <FileInput
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                id="screenshot-input"
              />
              <FileLabel htmlFor="screenshot-input">
                {screenshotFile ? (
                  <>
                    ✓ {screenshotFile.name}
                  </>
                ) : (
                  <>
                    📸 Click to select image or drag & drop
                  </>
                )}
              </FileLabel>
            </FileInputWrapper>

            {screenshotFile && (
              <PreviewSection>
                <PreviewLabel>Preview:</PreviewLabel>
                <Preview src={URL.createObjectURL(screenshotFile)} alt="Screenshot preview" />
              </PreviewSection>
            )}

            <UploadButton
              onClick={handleUploadScreenshot}
              disabled={!screenshotFile || uploading}
            >
              {uploading ? '⏳ Uploading...' : '✓ Confirm & Submit'}
            </UploadButton>

            <BackButton onClick={() => setStep('payment')}>← Back to Payment Details</BackButton>
          </UploadSection>
        </ContentCard>
      )}

      {/* Recent Deposits */}
      {myDeposits.length > 0 && (
        <DepositsHistoryCard>
          <SectionTitle>Your Recent Deposits</SectionTitle>
          <DepositsTable>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myDeposits.slice(0, 5).map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    <AmountBadge>₹{(deposit.amount / 100).toFixed(2)}</AmountBadge>
                  </TableCell>
                  <TableCell>{deposit.transactionRef}</TableCell>
                  <TableCell>
                    <StatusBadge $status={deposit.status}>
                      {deposit.status === 'APPROVED' && '✓ Approved'}
                      {deposit.status === 'PENDING' && '⏳ Pending'}
                      {deposit.status === 'SCREENSHOT_UPLOADED' && '📸 Awaiting Review'}
                      {deposit.status === 'REJECTED' && '✗ Rejected'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{new Date(deposit.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DepositsTable>
        </DepositsHistoryCard>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
`;

const Header = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #999;
  margin: 0;
`;

const AlertBox = styled.div<{ $type: 'error' | 'success' }>`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  background: ${(p) => (p.$type === 'error' ? '#ffe6e6' : '#e8f5e9')};
  color: ${(p) => (p.$type === 'error' ? '#d32f2f' : '#2e7d32')};
  border-left: 4px solid ${(p) => (p.$type === 'error' ? '#d32f2f' : '#2e7d32')};
`;

const AlertIcon = styled.span`
  font-size: 1.2rem;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #eee;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
`;

const LinkOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const LinkOption = styled.div<{ $selected: boolean }>`
  padding: 14px;
  border: 2px solid ${(p) => (p.$selected ? '#667eea' : '#e0e0e0')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: ${(p) => (p.$selected ? '#f0f4ff' : 'white')};

  &:hover {
    border-color: #667eea;
  }
`;

const LinkName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const LinkVPA = styled.div`
  font-size: 0.9rem;
  color: #999;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #999;
`;

const AmountButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const AmountButton = styled.button<{ $selected: boolean }>`
  padding: 14px;
  border: 2px solid ${(p) => (p.$selected ? '#667eea' : '#e0e0e0')};
  background: ${(p) => (p.$selected ? '#667eea' : 'white')};
  color: ${(p) => (p.$selected ? 'white' : '#333')};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #667eea;
  }
`;

const OrDivider = styled.div`
  text-align: center;
  color: #999;
  margin: 16px 0;
  font-weight: 600;
`;

const CustomAmountSection = styled.div`
  margin-bottom: 20px;
`;

const CustomInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ProceedButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PaymentDetailsBox = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  border-left: 4px solid #667eea;
`;

const PaymentDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 0.95rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #666;
`;

const DetailValue = styled.span`
  color: #333;
  font-family: 'Courier New', monospace;
`;

const DetailValueWithCopy = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  code {
    background: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
`;

const CopyButton = styled.button`
  padding: 4px 8px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background: #5568d3;
  }
`;

const PaymentInstructions = styled.div`
  background: #e8f5e9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const InstructionTitle = styled.h3`
  font-size: 1rem;
  color: #2e7d32;
  margin: 0 0 10px 0;
`;

const InstructionList = styled.ol`
  margin: 0;
  padding-left: 20px;

  li {
    margin-bottom: 6px;
    color: #333;
  }
`;

const PaymentLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const UPIButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  }
`;

const ManualButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  color: #333;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    background: #f0f4ff;
  }
`;

const UploadSection = styled.div``;

const UploadPrompt = styled.p`
  color: #666;
  margin-bottom: 20px;
  font-size: 0.95rem;
`;

const FileInputWrapper = styled.div`
  margin-bottom: 20px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  display: block;
  padding: 40px 20px;
  border: 2px dashed #667eea;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  background: #f0f4ff;
  color: #667eea;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: #667eea;
    color: white;
  }
`;

const PreviewSection = styled.div`
  margin-bottom: 20px;
`;

const PreviewLabel = styled.div`
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
`;

const Preview = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DepositsHistoryCard = styled(ContentCard)`
  margin-top: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 20px 0;
`;

const DepositsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: #f5f5f5;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  text-align: left;
  font-size: 0.9rem;
`;

const AmountBadge = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(p) => {
    switch (p.$status) {
      case 'APPROVED':
        return '#e8f5e9';
      case 'REJECTED':
        return '#ffebee';
      case 'SCREENSHOT_UPLOADED':
        return '#fff3e0';
      default:
        return '#f5f5f5';
    }
  }};
  color: ${(p) => {
    switch (p.$status) {
      case 'APPROVED':
        return '#2e7d32';
      case 'REJECTED':
        return '#d32f2f';
      case 'SCREENSHOT_UPLOADED':
        return '#f57c00';
      default:
        return '#666';
    }
  }};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
`;

export default DepositPage;
