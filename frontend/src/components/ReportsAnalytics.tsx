import React, { useState } from 'react';
import styled from 'styled-components';
import {
  exportSpinsCSV,
  exportTransactionsCSV,
  exportUsersCSV,
  exportRTPCSV,
  exportAdminLogsCSV,
  downloadCSV,
  getRTPReport,
  getSpinLogsReport,
  getTransactionReport,
  getAdminLogs,
} from '../services/adminApi';

interface ReportData {
  type: 'spins' | 'transactions' | 'users' | 'rtp' | 'admin-logs';
  label: string;
  icon: string;
  description: string;
}

const reports: ReportData[] = [
  {
    type: 'spins',
    label: 'Spin Logs',
    icon: '🎰',
    description: 'Export all spin logs and game activity data',
  },
  {
    type: 'transactions',
    label: 'Transactions',
    icon: '💳',
    description: 'Export wallet transactions and balance history',
  },
  {
    type: 'users',
    label: 'Users',
    icon: '👥',
    description: 'Export user list and registration data',
  },
  {
    type: 'rtp',
    label: 'RTP Analysis',
    icon: '📊',
    description: 'Export RTP metrics and statistical analysis',
  },
  {
    type: 'admin-logs',
    label: 'Admin Logs',
    icon: '🔐',
    description: 'Export admin activity and system audit logs',
  },
];

const ReportsAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleExport = async (reportType: string) => {
    setLoading(reportType);
    setError('');
    setSuccess('');

    try {
      let blob: Blob;
      const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

      switch (reportType) {
        case 'spins':
          blob = await exportSpinsCSV(undefined, undefined, startDate, endDate);
          downloadCSV(blob, filename);
          break;
        case 'transactions':
          blob = await exportTransactionsCSV(undefined, undefined, startDate, endDate);
          downloadCSV(blob, filename);
          break;
        case 'users':
          blob = await exportUsersCSV(undefined, undefined, startDate, endDate);
          downloadCSV(blob, filename);
          break;
        case 'rtp':
          blob = await exportRTPCSV(startDate, endDate);
          downloadCSV(blob, filename);
          break;
        case 'admin-logs':
          blob = await exportAdminLogsCSV(undefined, undefined, startDate, endDate);
          downloadCSV(blob, filename);
          break;
        default:
          setError('Unknown report type');
      }

      setSuccess(`${reportType} report exported successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Failed to export ${reportType}:`, err);
      setError(`Failed to export ${reportType}. Please try again.`);
    } finally {
      setLoading('');
    }
  };

  const handleViewReport = async (reportType: string) => {
    setLoading(reportType);
    setError('');

    try {
      switch (reportType) {
        case 'spins':
          await getSpinLogsReport({
            startDate,
            endDate,
            limit: 100,
          });
          break;
        case 'transactions':
          await getTransactionReport({
            startDate,
            endDate,
            limit: 100,
          });
          break;
        case 'rtp':
          await getRTPReport({
            startDate,
            endDate,
            period: 'daily',
          });
          break;
        case 'admin-logs':
          await getAdminLogs(undefined, undefined, 50, 0);
          break;
        default:
          break;
      }
      setSuccess(`${reportType} data loaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Failed to load ${reportType}:`, err);
      setError(`Failed to load ${reportType}. Please try again.`);
    } finally {
      setLoading('');
    }
  };

  return (
    <Container>
      <Header>
        <Title>Reports & Analytics</Title>
        <Subtitle>Export data and view detailed reports</Subtitle>
      </Header>

      <FilterSection>
        <FilterContainer>
          <FilterLabel>Date Range Filter</FilterLabel>
          <DateInputs>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              title="Start Date"
            />
            <Dash>—</Dash>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              title="End Date"
            />
          </DateInputs>
          <FilterHint>
            Leave blank to include all data. Start date and end date are optional.
          </FilterHint>
        </FilterContainer>
      </FilterSection>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ReportsGrid>
        {reports.map((report) => (
          <ReportCard key={report.type}>
            <ReportIcon>{report.icon}</ReportIcon>
            <ReportLabel>{report.label}</ReportLabel>
            <ReportDescription>{report.description}</ReportDescription>

            <ButtonGroup>
              <ViewButton
                onClick={() => handleViewReport(report.type)}
                disabled={loading === report.type}
              >
                {loading === report.type ? 'Loading...' : '📊 View'}
              </ViewButton>
              <ExportButton
                onClick={() => handleExport(report.type)}
                disabled={loading === report.type}
              >
                {loading === report.type ? 'Exporting...' : '⬇️ Export'}
              </ExportButton>
            </ButtonGroup>
          </ReportCard>
        ))}
      </ReportsGrid>

      <InfoSection>
        <InfoTitle>📋 Report Guidelines</InfoTitle>
        <InfoList>
          <InfoItem>
            <strong>Spin Logs:</strong> Complete game activity including spins, wins, and user actions
          </InfoItem>
          <InfoItem>
            <strong>Transactions:</strong> All wallet transactions, deposits, withdrawals, and balance changes
          </InfoItem>
          <InfoItem>
            <strong>Users:</strong> User registration data, roles, status, and account information
          </InfoItem>
          <InfoItem>
            <strong>RTP Analysis:</strong> Return to Player metrics and statistical performance analysis
          </InfoItem>
          <InfoItem>
            <strong>Admin Logs:</strong> All administrative actions, system changes, and audit trail
          </InfoItem>
        </InfoList>
      </InfoSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 40px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #1e3c72;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #667eea;
`;

const FilterSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 40px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
`;

const FilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #1e3c72;
  font-size: 1.1rem;
`;

const DateInputs = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const Input = styled.input`
  flex: 1;
  min-width: 150px;
  padding: 12px 16px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1e3c72;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:hover {
    border-color: #1e3c72;
  }
`;

const Dash = styled.span`
  color: #667eea;
  font-weight: 600;
  font-size: 1.2rem;
`;

const FilterHint = styled.p`
  font-size: 0.9rem;
  color: #999;
  margin-top: 5px;
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
`;

const ReportCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const ReportIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 15px;
`;

const ReportLabel = styled.h3`
  font-size: 1.3rem;
  color: #1e3c72;
  margin-bottom: 10px;
`;

const ReportDescription = styled.p`
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const BaseButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }
`;

const ViewButton = styled(BaseButton)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }
`;

const ExportButton = styled(BaseButton)`
  background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  }
`;

const ErrorMessage = styled.div`
  background: #ffe0e0;
  color: #d32f2f;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #d32f2f;
`;

const SuccessMessage = styled.div`
  background: #e0ffe0;
  color: #2e7d32;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #2e7d32;
`;

const InfoSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
`;

const InfoTitle = styled.h3`
  font-size: 1.3rem;
  color: #1e3c72;
  margin-bottom: 15px;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const InfoItem = styled.li`
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
  line-height: 1.6;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: #1e3c72;
  }
`;

export default ReportsAnalytics;
