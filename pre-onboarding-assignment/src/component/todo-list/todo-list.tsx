import { useState } from "react";
import { BACKEND_URL } from "../../environment";
import { FcCheckmark } from 'react-icons/fc';
import './todo.scss';

function TodoList(props: any) {

    const access_token = localStorage.getItem('login-token');
    const [editSentence, setEditSentence] = useState(props.content);
    const [editCompleted, setEditCompleted] = useState(props.completed);
    const [editStatus, setEditStatus] = useState(false);

    function onEditHandler(e: any) {

        if (editStatus) {
            fetch(`${BACKEND_URL}/todos/${props.id}`, {
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
                    props.listReload();
                })
                .catch(error => {
                    alert("To-do list 수정에 실패하였습니다.");
                    console.log(error);
                })
        }
        setEditStatus(!editStatus);
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
            <FcCheckmark />
            <input
                className="todo-box"
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