import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #0051FF;
    --secondary-color: #F5F7FF;
    --light-blue: #E1EEFF;
    --text-color: #414141;
    --text-light: #8C8C8C;
    --text-lighter: #757575;
    --border-color: #D9D9D9;
    --border-dark: #C0C0C0;
    --white: #FFFFFF;
    --table-header: #E9ECF8;
    --shadow: 0px 4px 11px rgba(0, 0, 0, 0.15);
    --light-shadow: 0px -1px 10px rgba(0, 0, 0, 0.15);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--secondary-color);
    color: var(--text-color);
  }

  button {
    cursor: pointer;
    border: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  input, button, textarea, select {
    font-family: inherit;
  }
`;

export default GlobalStyles;
