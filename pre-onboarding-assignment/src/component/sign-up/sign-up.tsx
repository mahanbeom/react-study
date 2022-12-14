import React from 'react';
import { Link } from 'react-router-dom';
import '../css/sign-up.scss';

function SignUp() {

    return (
        <div className="page">
            <div className="signup-container">
                <h1>Sign Up</h1>
                <label>Email</label>
                <input type="email" placeholder="이메일을 입력해주세요." />
                <label>Password</label>
                <input type="password" placeholder="비밀번호를 입력해주세요." />
                <button type="submit">Sign Up</button>
                <Link to="/" className="link">Back to login page</Link>
            </div>
        </div>
    );
}

export default SignUp;
