  import React, { Component } from "react";
  import "./App.css";
  import SockJS from "sockjs-client"; // SockJS 모듈 가져오기
  export default class App extends 
  Component {
    constructor(props) {
      super(props);
      this.state = {
        name: "", //id
        msg: "", //메세지 내용
        messageList: [], //메세지 리스트
        grid: "", // Grid 항목
        subscribeValue: "",
        subscribe: [], // 구독 값을 담을 state 추가
      };
      this.socket = null;
    }


    createSockJS = () => {
      if (this.socket === null && this.state.name) { // 중복 호출 방지
        this.socket = new SockJS('http://localhost:8080/connect', null, {transports:["websocket"]});
        console.log("request")
        this.socket.onopen = () => {
          console.log("Socket connection established");
        };
        this.socket.onmessage = (message) => {
          console.log(message);
          // 새로운 메세지가 도착할 때마다 처리
          const newMessage = JSON.parse(message.data);
          this.setState((prevState) => ({
            messageList: [...prevState.messageList, newMessage],
          }));
        };
      }
    };
    
    sendMsg = (e) => {
      e.preventDefault();
      const message = {
        name: this.state.name,
        body: this.state.msg,
        grid: this.state.grid, // Grid 항목 추가
      };
      this.socket.send(JSON.stringify(message)); // 서버로 메세지 전송
      this.setState({
        msg: "",
        grid: "", // 보내고 나서 Grid 항목 초기화
      });
    };

    onChange = (e) => {
      this.setState({
        [e.target.name]: e.target.value,
      });
    };

  onAddClick = () => {
    const { subscribeValue } = this.state;
    if (subscribeValue && !this.state.subscribe.includes(subscribeValue)) {
      // subscribeValue가 비어있지 않고, 이미 추가되어 있지 않은 값인 경우에만 추가
      this.setState(
        (prevState) => ({
          subscribe: [...prevState.subscribe, subscribeValue],
          subscribeValue: "", // 추가 후 subscribeValue 초기화
        }),
        () => {
          console.log(this.state.subscribe); // 상태 업데이트 후에 출력
        }
      );
    }
  };

    // subscribe_buttun 버튼 클릭 이벤트 핸들러 추가
    onSubscribeClick = () => {
      const { subscribe } = this.state;
      if (subscribe.length > 0) {
        const requestBody = {
          name: "yapyap",
          grids: [...subscribe],
        };
        fetch("http://localhost:8080/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data); // 서버의 응답 데이터 처리 (optional)
          })
          .catch((error) => {
            console.error("Error sending subscribe request:", error);
          });
      }
      this.setState({
        subscribe: [],
      });
    };

    onIdButtonClick = () => {
      const nameValue = document.getElementById("id").value;
      if (nameValue) {
        this.setState(
          {
            name: nameValue, // id input의 값을 name 변수에 저장하고 id input 초기화
          },
          () => {
            // SockJS 생성
            this.createSockJS();
          }
        );
        document.getElementById("id").value = "";
        console.log(this.state.name)
      }
    };

    componentDidUpdate(prevProps, prevState) {
      // 새로운 메시지가 도착했을 때에만 스크롤 바를 아래로 이동
      if (prevState.messageList.length !== this.state.messageList.length) {
        const chatList = document.querySelector(".chat_list");
        chatList.scrollTop = chatList.scrollHeight;
      }
    }


    render() {
      return (
        <div>
          <input
            type="text"
            onChange={this.onChange}
            value={this.state.name}
            name="name"
            id="id"
            placeholder="아이디"
          />
          <button
            className="idButton"
            onClick={this.onIdButtonClick}>
              연결
            </button>
            <button 
              className="disconncet"
            >
              연결종료
              </button>
            <div className="chat_list">
            <div className="chat_header">
              <span className="header-item">UserName</span>
              <span className="header-item">Message Text</span>
              <span className="header-item">Grid</span>
            </div>
            {this.state.messageList.map((item, index) => (
              <div key={index} className="chat_message">
                <span className="username">{item.sender}</span>
                <span className="msg_text">{item.body}</span>
                <span className="grid">{item.grid}</span>
              </div>
            ))}
          </div>
          <form className="chat_con" onSubmit={this.sendMsg}>
            <div className="chat_inputs">
              <input
                type="text"
                onChange={this.onChange}
                value={this.state.msg}
                name="msg"
                id="msg"
                placeholder="메세지내용"
              />
              <input
                type="text"
                onChange={this.onChange}
                value={this.state.grid}
                name="grid" // Grid 항목 추가
                id="grid"
                placeholder="Grid"
              />
            </div>
            <button className="chat_button" type="submit">
              보내기
            </button>
          </form>
          <div>
            <p>Grid 구독</p>
            <input
              type="text"
              onChange={this.onChange}
              value={this.state.subscribeValue}
              name="subscribeValue"
              id="subscribe"
              placeholder="subscribe"
              maxLength={1}
            />
            <button
              className="subscribe_add_buttun"
              type="button"
              onClick={this.onAddClick}
            >추가</button>
            <button
              className="subscribe_buttun"
              type="button" // 구독 버튼은 submit으로 보내지 않기 위해 type을 button으로 설정
              onClick={this.onSubscribeClick} // 클릭 이벤트 핸들러 연결
            >
              구독
            </button>
          </div>
        </div>
      );
    }
  }
