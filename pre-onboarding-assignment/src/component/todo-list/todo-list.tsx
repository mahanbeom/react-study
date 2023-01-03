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

    useEffect(() => {
        tokenVerificaion();
    }, []);

    return (
        <div className="page">
            <h1>Todo List</h1>
        </div>
    );
}

export default TodoList;
