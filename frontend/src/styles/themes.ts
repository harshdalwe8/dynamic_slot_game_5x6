const themes = {
  default: {
    background: '#ffffff',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    textColor: '#212529',
    button: {
      background: '#007bff',
      textColor: '#ffffff',
    },
    slot: {
      symbolColors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
      borderColor: '#000000',
    },
  },
  dark: {
    background: '#343a40',
    primaryColor: '#17a2b8',
    secondaryColor: '#6c757d',
    textColor: '#ffffff',
    button: {
      background: '#17a2b8',
      textColor: '#ffffff',
    },
    slot: {
      symbolColors: ['#ffcc00', '#ff6699', '#66ccff', '#ccff66', '#ffccff'],
      borderColor: '#ffffff',
    },
  },
  retro: {
    background: '#f8f9fa',
    primaryColor: '#ffc107',
    secondaryColor: '#6f42c1',
    textColor: '#212529',
    button: {
      background: '#ffc107',
      textColor: '#212529',
    },
    slot: {
      symbolColors: ['#ff5733', '#33ff57', '#3357ff', '#f1c40f', '#e74c3c'],
      borderColor: '#000000',
    },
  },
};

export default themes;