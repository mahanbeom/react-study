import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './todo-list.scss';

function TodoList() {

    const navigate = useNavigate();

    function tokenVerificaion() {
        if (!localStorage.getItem('login-token')) {
            return navigate("/");
        }
    }

    function onLogoutHandler() {
        localStorage.removeItem('login-token');
        return navigate("/");
    }

    useEffect(() => {
        tokenVerificaion();
    }, []);

    return (
        <div className="page">
            <div className="header">
                <span>TODOLIST</span>
                <button onClick={onLogoutHandler}>Logout</button>
            </div>
        </div>
    );
}

export default TodoList;
