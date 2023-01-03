import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../environment';
import './sign-in.scss';

function SignIn() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    function authenticationCheck() {
        if (localStorage.getItem('login-token')) {
            navigate('/todo');
        }
    }

    function onSubmitHandler(e: any) {
        e.preventDefault();

        fetch(`${BACKEND_URL}/auth/signin`, {
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
                    console.log(res.access_token);
                    localStorage.setItem("login-token", res.access_token);
                    navigate('/todo');
                }
            })
            .catch(function (error) {
                alert("다시 시도해주세요.");
                console.log('There has been a problem with your fetch operation: ', error.message);
            });
    }

    useEffect(() => {
        authenticationCheck();
    }, []);

    return (
        <div className="page">
            <form className="login-container" onSubmit={onSubmitHandler}>
                <h1>Login</h1>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value) }} placeholder="이메일을 입력해주세요." />
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value) }} placeholder="비밀번호를 입력해주세요." />
                <button type="submit">Login</button>
                <Link to="/sign-up" className="link">Sign Up</Link>
            </form>
        </div>
    );
}

export default SignIn;
