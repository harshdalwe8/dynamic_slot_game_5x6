import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SlotGrid from './components/SlotGrid';
import ThemeSelector from './components/ThemeSelector';
import GameControls from './components/GameControls';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/themes.css';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <ThemeSelector />
          <GameControls />
          <Switch>
            <Route path="/" exact component={SlotGrid} />
          </Switch>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;