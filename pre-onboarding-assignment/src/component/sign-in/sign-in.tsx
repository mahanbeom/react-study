import React from 'react';
import { Link } from 'react-router-dom';
import './sign-in.scss';

function SignIn() {
    return (
        <div className="page">
            <div className="login-container">
                <h1>Login</h1>
                <label>Email</label>
                <input type="email" placeholder="이메일을 입력해주세요." />
                <label>Password</label>
                <input type="password" placeholder="비밀번호를 입력해주세요." />
                <button type="submit">Login</button>
                <Link to="/sign-up" className="link">Sign Up</Link>
            </div>
        </div>
    );
}

export default SignIn;
