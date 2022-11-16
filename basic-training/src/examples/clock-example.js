import React from "react";

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
export class Clock extends React.Component {
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
        <h1># Clock Example</h1>
        <h2>Hello, World!</h2>
        <h3>It is {this.state.date.toLocaleTimeString()}.</h3>
      </div>
    );
  }
}
