import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../environment';
import './sign-up.scss';

function SignUp() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formCheck, setFormCheck] = useState(false);

    const navigate = useNavigate();

    const emailRegEx = /^[A-Za-z0-9]*@([.]?[A-Za-z0-9])*/;
    const passwordRegEx = /^[A-Za-z0-9]{8,}$/;

    const emailCheck = (userEmail: string) => {
        console.log(emailRegEx.test(userEmail))
        return emailRegEx.test(userEmail);
    }

    const passwordCheck = (userPassword: string) => {
        console.log(passwordRegEx.test(userPassword));
        return passwordRegEx.test(userPassword);
    }

    function onEmailHandler(e: any) {
        setEmail(e.target.value);
        emailCheck(e.target.value);
        formValidater();
    }

    function onPasswordHandler(e: any) {
        setPassword(e.target.value);
        passwordCheck(e.target.value);
        formValidater();
    }

    function formValidater() {
        if (emailRegEx.test(email) && passwordRegEx.test(password)) {
            setFormCheck(true);
        } else {
            setFormCheck(false);
        }
    }

    function onSubmitHandler(e: any) {
        e.preventDefault();

        fetch(`${BACKEND_URL}/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        })
            .then(res => res.json())
            .then(res => {
                if (res.access_token) {
                    alert("회원가입에 성공하였습니다.");
                    navigate('/');
                }
            });
    }

    return (
        <div className="page">
            <form className="signup-container" onSubmit={onSubmitHandler}>
                <h1>Sign Up</h1>
                <label>Email</label>
                <input type="email" value={email} onChange={onEmailHandler} placeholder="이메일을 입력해주세요." />
                <label>Password</label>
                <input type="password" value={password} onChange={onPasswordHandler} placeholder="비밀번호를 입력해주세요." />
                <button type="submit" disabled={!formCheck}>Sign Up</button>
                <Link to="/" className="link">Back to login page</Link>
            </form>
        </div>
    );
}

export default SignUp;
