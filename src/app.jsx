import React from 'react';
import ReactDOM from 'react-dom';
import AppContainer from './containers/app.container';

import './styles/global.scss';
import './styles/smalltalk.min.css';

class App extends React.Component {
  render () {
    return (
      <AppContainer />
    );
  }
}

// Render to index.html
ReactDOM.render(
  <App />,
  document.getElementById('root')
);
