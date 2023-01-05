import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './todo.scss';
import TodoCreate from './todo-create';
import TodoList from './todo-list';
import { BACKEND_URL } from '../../environment';

function TodoMain() {

    const access_token = localStorage.getItem('login-token');
    const navigate = useNavigate();
    const [todoList, setTodoList] = useState([]);

    function tokenVerificaion() {
        if (!localStorage.getItem('login-token')) {
            return navigate("/");
        }
    }

    function onLogoutHandler() {
        localStorage.removeItem('login-token');
        return navigate("/");
    }

    function listReload() {
        console.log("reload");
        fetch(`${BACKEND_URL}/todos`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
        })
            .then(res => res.json())
            .then(res => {
                console.log(res);
                setTodoList(res);
            })
            .catch((error) => {
                alert("To-do list 조회에 실패하였습니다.");
                console.log(error);
            });
    }

    useEffect(() => {
        tokenVerificaion();
        listReload();
    }, []);

    return (
        <div className="todo-page">
            <div className="header">
                <span>TODOLIST</span>
                <button onClick={onLogoutHandler}>Logout</button>
            </div>
            <div className='content-container'>
                <TodoCreate listReload={listReload} />
                {
                    todoList.map(
                        (todo: any) => <TodoList key={todo.id} content={todo.todo} />
                    )
                }
            </div>
        </div>
    );
}

export default TodoMain;
