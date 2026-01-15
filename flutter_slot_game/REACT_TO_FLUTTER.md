# 🔄 React to Flutter Migration Guide

This guide helps developers familiar with the React codebase understand the Flutter conversion.

## Architecture Comparison

| React | Flutter | Notes |
|-------|---------|-------|
| React Components | Flutter Widgets | Both are composable UI elements |
| React Context | Riverpod Providers | State management |
| React Hooks (useState, useEffect) | StatefulWidget, Hooks | State and lifecycle |
| styled-components | ThemeData, Custom Widgets | Styling approach |
| React Router | go_router | Navigation |
| axios/fetch | dio | HTTP client |
| TypeScript interfaces | Freezed classes | Type definitions |

## Code Comparison Examples

### 1. Component Definition

**React (TypeScript):**
```typescript
interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <Container>
      <Input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </Container>
  );
};
```

**Flutter (Dart):**
```dart
class LoginScreen extends ConsumerStatefulWidget {
  final VoidCallback onSuccess;
  
  const LoginScreen({required this.onSuccess, Key? key}) : super(key: key);
  
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    return Container(
      child: TextField(
        controller: _emailController,
      ),
    );
  }
}
```

### 2. State Management

**React Context:**
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType>({});

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Using context
const { user } = useAuth();
```

**Flutter Riverpod:**
```dart
// providers/auth_provider.dart
final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService: apiService);
});

// Using provider
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider);
    return user.when(
      data: (user) => Text(user?.email ?? ''),
      loading: () => CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
    );
  }
}
```

### 3. API Calls

**React (axios):**
```typescript
// services/authApi.ts
export const login = async (email: string, password: string) => {
  const response = await axios.post('/auth/login', { email, password });
  return response.data;
};

// Using in component
const handleLogin = async () => {
  try {
    const data = await login(email, password);
    setUser(data.user);
  } catch (error) {
    console.error(error);
  }
};
```

**Flutter (dio):**
```dart
// services/api_service.dart
class ApiService {
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data);
  }
}

// Using in widget
Future<void> _handleLogin() async {
  try {
    final apiService = ref.read(apiServiceProvider);
    final response = await apiService.login(
      email: _emailController.text,
      password: _passwordController.text,
    );
    // Handle success
  } catch (e) {
    // Handle error
  }
}
```

### 4. Navigation

**React Router:**
```typescript
import { useHistory } from 'react-router-dom';

const MyComponent = () => {
  const history = useHistory();
  
  const navigate = () => {
    history.push('/game');
  };
  
  return <button onClick={navigate}>Go to Game</button>;
};
```

**Flutter go_router:**
```dart
import 'package:go_router/go_router.dart';

class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () => context.push('/game'),
      child: Text('Go to Game'),
    );
  }
}
```

### 5. Styling

**React styled-components:**
```typescript
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
`;

<Button onClick={handleClick}>Click Me</Button>
```

**Flutter Widgets:**
```dart
ElevatedButton(
  onPressed: handleClick,
  style: ElevatedButton.styleFrom(
    backgroundColor: Theme.of(context).primaryColor,
    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),
  child: Text(
    'Click Me',
    style: TextStyle(
      color: Colors.white,
      fontWeight: FontWeight.bold,
    ),
  ),
)
```

### 6. Lists and Iteration

**React:**
```typescript
const ThemeList = ({ themes }: { themes: Theme[] }) => {
  return (
    <div>
      {themes.map(theme => (
        <ThemeCard key={theme.id} theme={theme} />
      ))}
    </div>
  );
};
```

**Flutter:**
```dart
class ThemeList extends StatelessWidget {
  final List<Theme> themes;
  
  const ThemeList({required this.themes, Key? key}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: themes.length,
      itemBuilder: (context, index) {
        return ThemeCard(theme: themes[index]);
      },
    );
  }
}
```

### 7. Effects/Lifecycle

**React useEffect:**
```typescript
useEffect(() => {
  fetchData();
  
  return () => {
    cleanup();
  };
}, [dependency]);
```

**Flutter State Lifecycle:**
```dart
class MyWidget extends StatefulWidget {
  @override
  State<MyWidget> createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  @override
  void initState() {
    super.initState();
    fetchData();
  }
  
  @override
  void dispose() {
    cleanup();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
```

### 8. Forms

**React:**
```typescript
const [formData, setFormData] = useState({ email: '', password: '' });

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

<input name="email" value={formData.email} onChange={handleChange} />
```

**Flutter:**
```dart
final _emailController = TextEditingController();
final _passwordController = TextEditingController();

@override
void dispose() {
  _emailController.dispose();
  _passwordController.dispose();
  super.dispose();
}

TextField(
  controller: _emailController,
  decoration: InputDecoration(hintText: 'Email'),
)
```

## File Structure Mapping

### React Structure
```
frontend/src/
├── App.tsx
├── components/
│   ├── Login.tsx
│   ├── SlotMachine.tsx
│   └── ...
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── services/
│   ├── api.ts
│   └── authApi.ts
└── hooks/
    └── useSlotGame.ts
```

### Flutter Structure
```
flutter_slot_game/lib/
├── main.dart
├── screens/
│   ├── login_screen.dart
│   ├── game_screen.dart
│   └── ...
├── providers/
│   └── auth_provider.dart
├── services/
│   └── api_service.dart
├── game/
│   └── slot_game.dart  # Flame game engine
└── widgets/
    └── custom_widgets.dart
```

## Key Concepts Translation

### React Concepts → Flutter Equivalents

1. **Props** → **Constructor Parameters**
   - Pass data via constructor in Flutter

2. **State (useState)** → **StatefulWidget State**
   - Use `setState()` to update UI

3. **Context** → **InheritedWidget / Riverpod**
   - Riverpod is more powerful and easier

4. **Refs** → **GlobalKey / Controllers**
   - Use controllers for form inputs, animation controllers for animations

5. **Memoization (useMemo)** → **computed properties**
   - Dart getters are automatically memoized if pure

6. **Callbacks (useCallback)** → **Functions**
   - Dart functions are already optimized

## Slot Game: CSS Animations → Flame Engine

### React (CSS keyframes):
```typescript
const spinAnimation = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
`;

const Reel = styled.div`
  animation: ${spinAnimation} 2s linear infinite;
`;
```

### Flutter (Flame):
```dart
class SlotMachineReel extends Component {
  double offset = 0.0;
  double spinSpeed = 600.0;
  
  @override
  void update(double dt) {
    super.update(dt);
    if (isSpinning) {
      offset += spinSpeed * dt;
    }
  }
  
  @override
  void render(Canvas canvas) {
    // Draw symbols at offset position
  }
}
```

## Best Practices Migration

### React Best Practices → Flutter Best Practices

1. **Immutability**
   - React: Use spread operators, immutable updates
   - Flutter: Use `freezed` for immutable models

2. **Component Reusability**
   - React: Extract small components
   - Flutter: Extract small widgets (same principle)

3. **Performance**
   - React: Use React.memo, useMemo, useCallback
   - Flutter: Use `const` constructors, `ListView.builder` for lists

4. **Error Boundaries**
   - React: Error Boundary components
   - Flutter: Try-catch blocks, ErrorWidget

5. **Testing**
   - React: Jest, React Testing Library
   - Flutter: flutter_test, mockito

## Common Pitfalls

### For React Developers Learning Flutter

1. **Don't think in terms of HTML/CSS**
   - Everything is a widget in Flutter
   - No separate markup and styles

2. **Controllers must be disposed**
   - Unlike React hooks, controllers need manual cleanup

3. **BuildContext is important**
   - Pass it correctly, especially in async operations

4. **Stateless vs Stateful**
   - Choose the right widget type based on data changes

5. **Hot Reload vs Hot Restart**
   - Hot reload is like React hot reload
   - Hot restart is like full page refresh

## Migration Checklist

- [x] Set up Flutter project with dependencies
- [x] Convert data models (TypeScript interfaces → Freezed classes)
- [x] Set up API service (axios → dio)
- [x] Implement state management (Context → Riverpod)
- [x] Convert all screens (React components → Flutter widgets)
- [x] Implement navigation (React Router → go_router)
- [x] Convert slot game (CSS animations → Flame engine)
- [ ] Add Rive animations
- [ ] Add sound effects
- [ ] Implement tests
- [ ] Performance optimization
- [ ] Platform-specific configurations

## Resources for React Developers

- [Flutter for React Native Developers](https://docs.flutter.dev/get-started/flutter-for/react-native-devs)
- [Dart for JavaScript Developers](https://dart.dev/guides/language/coming-from/js-to-dart)
- [Riverpod Documentation](https://riverpod.dev)
- [Flame Game Engine](https://docs.flame-engine.org)

---

**Questions?** The Flutter community is very active on Discord, Stack Overflow, and Reddit!
