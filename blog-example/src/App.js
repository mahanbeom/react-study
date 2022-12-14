/* esLint-disable */

import './App.css';
import { useState } from 'react';

function App() {

	/* 
		useState => state에 자료를 저장함. 변수랑 비슷
		글제목 => state에 보관했던 자료 
		b => state 변경을 도와주는 함수
		
		# Destructuring 문법
		let num = [1, 2];
		let a = num[0];
		let b = num[1];
		=> let [a, b] = [1, 2];
	*/
	let [postTitle, titleFuction] = useState(['Title1', 'Title2', 'Title3']);
	let [likeNum, like] = useState(0);


	return (
		<div className="App">
			<div className="black-nav">
				<h4>Blog</h4>
			</div>
			<div className='list' style={{
				padding: "10px",
				display: "flex",
				flexDirection: "row",
				gap: "10px"
			}}>
				<button
					onClick={() => {
						// state가 array/object 일 경우 독립적으로 카피본을 만들어서 수정해야 함.
						// [...] => 괄호를 벗기고 다시 괄호를 씌운다는 뜻
						let copy = [...postTitle];
						copy[0] = 'First Title';
						titleFuction(copy);
					}}
				>
					Change first post title
				</button>

				<button
					onClick={() => {
						let copy = [...postTitle];
						copy.sort();
						titleFuction(copy);
					}}
				>
					Title sorting
				</button>
			</div>
			<div className='list'>
				<h4>{postTitle[0]} <span onClick={() => { like(likeNum + 1) }}>👍</span> {likeNum} </h4>
				<p>2월 17일 발행</p>
			</div>
			<div className='list'>
				<h4>{postTitle[1]}</h4>
				<p>2월 17일 발행</p>
			</div>
			<div className='list'>
				<h4>{postTitle[2]}</h4>
				<p>2월 17일 발행</p>
			</div>

			<PostDetail />
		</div>
	);
}

function PostDetail() {
	return (
		<div className='post-detail'>
			<h4>Title</h4>
			<p>Date</p>
			<p>Content</p>
		</div>
	);
}

export default App;
