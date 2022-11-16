import React from "react";

function WarningBanner(props) {
  if (!props.warn) {
    // 컴포넌트가 렌더링될 때 컴포넌트 자체를 숨기고 싶을 땐 return을 null로 반환하면 된다.
    return null;
  }

  return <div className="warning">Warning!</div>;
}

export class ComponentHide extends React.Component {
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
