import React, { lazy, Suspense } from 'react';
import logo from './logo.svg';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.scss';

const SignIn = lazy(() => import('./component/sign-in/sign-in'));
const SignUp = lazy(() => import('./component/sign-up/sign-up'));
const TodoMain = lazy(() => import('./component/todo-list'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path='/' element={<SignIn />} />
          <Route path='/sign-up' element={<SignUp />} />
          <Route path='/todo' element={<TodoMain />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;


/* <Route path='/' element={ localStorage.getItem('login-token') ? <Redirect to="/todo" /> : <SignIn /> }/> */
