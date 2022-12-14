import { useEffect, useState } from "react";
import { BACKEND_URL } from "../../environment";
import { FcCheckmark } from 'react-icons/fc';
import './todo.scss';

function TodoList({ todo, onReload }: any) {

    const access_token = localStorage.getItem('login-token');
    const [editSentence, setEditSentence] = useState(todo.todo);
    const [editCompleted, setEditCompleted] = useState(todo.isCompleted);
    const [editStatus, setEditStatus] = useState(false);

    useEffect(() => { }, [todo]);

    function onCompleteHandler(e: any) {
        setEditCompleted(e.target.checked);
        fetch(`${BACKEND_URL}/todos/${todo.id}`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${access_token}`,
                'Content-Type': "application/json",
            },
            body: JSON.stringify({
                todo: editSentence,
                isCompleted: !editCompleted,
            }),
        })
            .then(res => res.json())
            .then(res => {
                onReload();
            })
            .catch(error => {
                alert("To-do list 수정에 실패하였습니다.");
                console.log(error);
            })
    }

    function onEditHandler() {

        if (editStatus) {
            fetch(`${BACKEND_URL}/todos/${todo.id}`, {
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    todo: editSentence,
                    isCompleted: editCompleted,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    onReload();
                })
                .catch(error => {
                    alert("To-do list 수정에 실패하였습니다.");
                    console.log(error);
                })
        }
        setEditStatus(!editStatus);
    }

    function onDeleteHandler() {
        console.log(todo.id);
        fetch(`${BACKEND_URL}/todos/${todo.id}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
        })
            .then(res => {
                onReload();
            })
            .catch(error => {
                alert("To-do list 수정에 실패하였습니다.");
                console.log(error);
            })
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '3vh'
        }}>
            <input type="checkbox" checked={editCompleted} onChange={onCompleteHandler} />
            <FcCheckmark />
            <input
                className={editCompleted ? "todo-box completed" : "todo-box"}
                type="text"
                value={editSentence}
                disabled={!editStatus}
                onChange={(e) => { setEditSentence(e.target.value) }}
            />
            <button
                onClick={onEditHandler}
                style={{
                    whiteSpace: 'nowrap',
                    padding: '10px 12px',
                    backgroundColor: 'forestgreen',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: '600',
                    border: 'none',
                }}
            >
                {editStatus ? '저장' : '수정'}
            </button>
            <button
                onClick={onDeleteHandler}
                style={{
                    whiteSpace: 'nowrap',
                    padding: '10px 12px',
                    backgroundColor: 'saddlebrown',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: '600',
                    border: 'none',
                }}
            >
                삭제
            </button>
        </div>
    );
}

export default TodoList;