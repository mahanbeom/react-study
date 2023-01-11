import { useState } from 'react';
import { BiListPlus } from 'react-icons/bi';
import { BACKEND_URL } from '../../environment';

function TodoCreate(props: any) {

    const access_token = localStorage.getItem('login-token');
    const [sentence, setSentence] = useState("");

    function onSubmitHandler(e: any) {
        e.preventDefault();

        console.log(sentence);
        fetch(`${BACKEND_URL}/todos`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                todo: sentence,
            }),
        })
            .then(res => res.json())
            .then(res => {
                setSentence("");
                props.listReload();
            })
            .catch((error) => {
                alert("To-do list 추가에 실패하였습니다. 다시 시도해주세요.");
                console.log(error);
            });
    }

    return (
        <form style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '50px'
        }} onSubmit={onSubmitHandler}>
            <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                gap: '10px',
                alignItems: 'center',
                border: '1px solid black',
                borderRadius: '5px',
                padding: '15px 20px'
            }}>
                <BiListPlus />
                <input style={{
                    backgroundColor: 'transparent',
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px'
                }} value={sentence} onChange={(e) => { setSentence(e.target.value) }} />
            </div>
            <button style={{
                display: 'block',
                fontSize: '16px',
                padding: '15px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: 'olivedrab',
                color: 'white',
            }} type="submit">
                Add
            </button>
        </form>

    );
}

export default TodoCreate;
