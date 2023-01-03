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
        <div className="todo-page">
            <div className="header">
                <span>TODOLIST</span>
                <button onClick={onLogoutHandler}>Logout</button>
            </div>
            <div className='content-container'>
                <h2>Todo List</h2>
                <ul>
                    <li>
                        <span>sample data</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button>Edit</button>
                            <button>Delete</button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default TodoList;
