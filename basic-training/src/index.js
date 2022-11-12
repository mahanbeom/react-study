import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

//====================================================================

function Welcome(props) {
  return <h2>hello, {props.name}!</h2>;
}

// function component
function App() {
  return (
    <div>
      <h1># Welcome Example</h1>
      <Welcome name="A"></Welcome>
      <Welcome name="B"></Welcome>
      <Welcome name="C"></Welcome>
    </div>
  );
}
// root.render(<App />);

//====================================================================

function Avatar(props) {
  return (
    <img className="Avatar" src={props.user.avatarUrl} alt={props.user.name} />
  );
}

function UserInfo(props) {
  return (
    <div className="UserInfo">
      <Avatar user={props.user} />
      <div className="UserInfo-name">{props.user.name}</div>
    </div>
  );
}

function Comment(props) {
  return (
    <div className="Comment">
      <UserInfo user={props.author} />
      <div className="Comment-text">{props.text}</div>
      <div className="Commet-date">{props.date}</div>
    </div>
  );
}

//====================================================================

/*
  1.root.render(<Clock />) 호출 시 React는 Clock 컴포넌트의 constructor 호출,
    현재 시각이 포함된 객체로 this.state를 초기화
  2.Clock 컴포넌트의 render() 호출한다. 이를 통해 React는 화면에 표시되어야 할 내용을 알게 됨.
    그 다음 Clock의 렌더링 출력값을 일치시키기 위해 DOM을 업데이트 함.
  3.Clock 출력값이 DOM에 삽입되면, componentDidMount() 생명주기 메서드를 호출한다.
    그 안에서 tick() 메서드 호출 설정을 브라우저에 요청한다.
  4.매초 브라우저가 tick() 메서드를 호출한다. 그 안에서 Clock 컴포넌트는 setState()에 현재 시각을 포함하는
    객체를 호출하면서 UI 업데이트를 진행한다. setState() 호출 덕분에 React는 state가 변경되는 것을
    인지하고 화면에 표시될 내용을 알아내기 위해 render() 메서드를 다시 호출한다.
    이때 render() 메서드 안의 this.state.date가 달라지고 렌더링 출력값은 업데이트된 시각을 포함한다.
  5.Clock 컴포넌트가 DOM으로부터 한 번이라도 삭제된 적이 있다면 React는 타이머를 멈추기 위해
    componentWillUnmount() 생명주기 메서드를 호출한다.
*/

// class component
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = { date: new Date() };
  }

  /** 컴포넌트 출력물이 DOM에 렌더링 된 후에 실행된다. */
  componentDidMount() {
    // angular - ngOnInit 같은 개념?
    this.timerID = setInterval(() => this.tick(), 1000);
  }

  /** 컴포넌트가 DOM으로부터 한 번이라도 삭제되면 실행된다. */
  componentWillUnmount() {
    // angular - ngOnDestroy 같은 개념?
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date(),
    });
  }

  render() {
    return (
      <div>
        <h2>Hello, World!</h2>
        <h3>It is {this.state.date.toLocaleTimeString()}.</h3>
      </div>
    );
  }
}

function ClockApp() {
  return (
    <div>
      <h1># Clock Example</h1>
      <Clock />
    </div>
  );
}

// root.render(<ClockApp />);

//====================================================================

function Form() {
  function handleSubmit(e) {
    e.preventDefault();
    console.log("you clicked submit.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1># Form Example</h1>
      <button type="submit">Submit</button>
    </form>
  );
}

// root.render(<Form />);

//====================================================================

class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isToggleOn: true };

    // 콜백에서 `this`가 작동하려면 아래와 같이 바인딩 해주어야 합니다.
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState((prevState) => ({
      isToggleOn: !prevState.isToggleOn,
    }));
  }

  render() {
    return (
      <div>
        <h1># Toggle Example</h1>
        <button onClick={this.handleClick}>
          {this.state.isToggleOn ? "ON" : "OFF"}
        </button>
      </div>
    );
  }
}

// root.render(<Toggle />);

//====================================================================

function UserGreeting(props) {
  return <h2>Welcome back!</h2>;
}

function GuestGreeting(props) {
  return <h2>Please sign up.</h2>;
}

function Greeting(props) {
  const isLoggedIn = props.isLoggedIn;

  if (isLoggedIn) {
    return <UserGreeting />;
  }
  return <GuestGreeting />;
}

function LoginButton(props) {
  return <button onClick={props.onClick}>Login</button>;
}

function LogoutButton(props) {
  return <button onClick={props.onClick}>Logout</button>;
}

class LoginControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
    this.state = { isLoggedIn: false }; // state 초기값 설정 및 초기화
  }

  handleLoginClick() {
    this.setState({ isLoggedIn: true });
  }

  handleLogoutClick() {
    this.setState({ isLoggedIn: false });
  }

  render() {
    const isLoggedIn = this.state.isLoggedIn;
    let button;

    button = isLoggedIn ? (
      <LogoutButton onClick={this.handleLogoutClick} />
    ) : (
      <LoginButton onClick={this.handleLoginClick} />
    );

    return (
      <div>
        <h1># LoginControl Example</h1>
        <Greeting isLoggedIn={isLoggedIn} />
        {button}
      </div>
    );
  }
}

// root.render(<LoginControl />);

//====================================================================

function WarningBanner(props) {
  if (!props.warn) {
    // 컴포넌트가 렌더링될 때 컴포넌트 자체를 숨기고 싶을 땐 return을 null로 반환하면 된다.
    return null;
  }

  return <div className="warning">Warning!</div>;
}

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showWarning: true };
    this.handleToggleClick = this.handleToggleClick.bind(this);
  }

  handleToggleClick() {
    this.setState((state) => ({
      showWarning: !state.showWarning,
    }));
  }

  render() {
    return (
      <div>
        <h1># Component Hide Example</h1>
        <WarningBanner warn={this.state.showWarning} />
        <button onClick={this.handleToggleClick}>
          {this.state.showWarning ? "Hide" : "Show"}
        </button>
      </div>
    );
  }
}

// root.render(<Page />);

//====================================================================

function ListItem(props) {
  return <li>{props.value}</li>;
}

function NumberList(props) {
  const numbers = props.numbers;
  const listItems = numbers.map((number) => (
    <ListItem key={number.toString()} value={number} />
  ));

  return (
    <div>
      <h1># List Example</h1>
      <ul>{listItems}</ul>
    </div>
  );
}

const numbers = [1, 2, 3, 4, 5];
//root.render(<NumberList numbers={numbers} />);

//====================================================================

function Blog(props) {
  const sidebar = (
    <ul>
      {props.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );

  const content = props.posts.map((post) => (
    <div key={post.id}>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
    </div>
  ));

  return (
    <div>
      <h1># List & Key Example</h1>
      {sidebar}
      <br />
      {content}
    </div>
  );
}

const posts = [
  { id: 1, title: "Hello World", content: "Welcome to learning React!" },
  { id: 2, title: "Installation", content: "You can install React from npm." },
];

// root.render(<Blog posts={posts} />);
//====================================================================

root.render(
  <div>
    <App />
    <hr />
    <ClockApp />
    <hr />
    <Form />
    <hr />
    <Toggle />
    <hr />
    <LoginControl />
    <hr />
    <Page />
    <hr />
    <NumberList numbers={numbers} />
    <hr />
    <Blog posts={posts} />
  </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
