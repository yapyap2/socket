  import React, { Component } from "react";
  import "./App.css";

  export default class App extends Component {
    constructor(props) {
      super(props);
      this.state = {
        name: "",
        msg: "",
        messageList: [],
        grid: "",
        searchGrid:"",
        subscribeValue: "",
        subscribe: [],
        nowSubscribed: [],
        socket: null, // Use socket as a state variable
        connected: false, 
        subscribeResponse: "",
        searchResponse: ""
      };
    }


    createWebSocket = () => {
      const { name } = this.state;
      if (!this.state.socket && name) {
        const socket = new WebSocket(`ws://43.202.94.217:8080/connect?name=${name}`);
  
        socket.onopen = () => {
          console.log("WebSocket connection established");
          this.setState({ socket });
        };
  
        socket.onmessage = (message) => {
          console.log(message);
          const newMessage = JSON.parse(message.data);
          this.setState((prevState) => ({
            messageList: [...prevState.messageList, newMessage],
          }));
        };
  
        socket.onclose = () => {
          console.log("WebSocket connection closed");
          this.setState({ socket: null });
        };
      }
    };
    

    sendMsg = (e) => {
      e.preventDefault();
      const { socket, name, msg, grid } = this.state;
      if (socket && name && msg && grid) {
        const message = {
          name,
          body: msg,
          grid,
        };
        socket.send(JSON.stringify(message));
        this.setState({
          msg: "",
          grid: "",
        });
      }
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
            name: this.state.name,
            grids: [...subscribe],
          };
          fetch("http://43.202.94.217:8080/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data); // 서버의 응답 데이터 처리 (optional)
              this.setState({ subscribeResponse: JSON.stringify(data, null, 2) }); // 응답 데이터를 state에 저장
            })
            .catch((error) => {
              console.error("Error sending subscribe request:", error);
            });
        }
        this.setState({
          nowSubscribed: subscribe,
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
            this.createWebSocket();
            this.setState({ connected: true });   
          }
        );
        document.getElementById("id").value = "";
        console.log(this.state.name)
      }
    };

    //그리드에 존재하는 메세지 검색
    fetchMessagesByGrid = () => {
      const { searchGrid } = this.state;
      if (searchGrid) {
        fetch(`http://43.202.94.217:8080/getMessage?grid=${searchGrid}`)
          .then((response) => response.json())
          .then((data) => {
            // API 응답 결과를 state에 저장
            this.setState({ searchResponse: JSON.stringify(data, null, 2) });
          })
          .catch((error) => {
            console.error("Error fetching messages:", error);
          });
      }
    };

    componentDidUpdate(prevProps, prevState) {
      // 새로운 메시지가 도착했을 때에만 스크롤 바를 아래로 이동
      if (prevState.messageList.length !== this.state.messageList.length) {
        const chatList = document.querySelector(".chat_list");
        chatList.scrollTop = chatList.scrollHeight;
      }
    }

    disconnect = () => {
      if (this.state.socket) {
        this.state.socket.close(); // Close the socket connection
        this.state.socket = null; // Reset the socket variable to null
        this.setState({ connected: false });
        this.state.messageList = [];
        console.log("disconnect")
      }
    };

    handleNameKeyPress = (event) => {
      if (event.key === "Enter") {
        this.onIdButtonClick();
      }
    };

    handleSubscribeKeyPress = (event) => {
      if (event.key === "Enter") {
        this.onAddClick();
      }
    };

    handleSearchKeyPress = (event) => {
      if (event.key === "Enter") {
        this.fetchMessagesByGrid();
      }
    };



    render() {
      const { connected, name } = this.state; // name도 사용할 수 있도록 추가
  
      return (
        <div>
          {/* 아이디 입력창 */}
          <input
            type="text"
            onChange={this.onChange}
            value={this.state.name}
            onKeyPress={this.handleNameKeyPress}
            name="name"
            id="id"
            placeholder="아이디"
          />
          {/* 연결 버튼 */}
          <button
            className="idButton"
            onClick={this.onIdButtonClick}
            style={{ display: connected ? "none" : "inline-block" }}
          >
            연결
          </button>
          {/* 연결 종료 버튼 */}
          <button
            className="disconncet"
            onClick={this.disconnect}
            style={{ display: connected ? "inline-block" : "none" }}
          >
            연결종료
          </button>
          {/* 채팅 목록 */}
          <div className="chat_list">
            <div className="chat_header">
              <span className="header-item">UserName</span>
              <span className="header-item">Message Text</span>
              <span className="header-item">Grid</span>
            </div>
            {this.state.messageList.map((item, index) => (
              <div key={index}
              className={`chat_message ${item.sender === name ? "highlight" : ""}`} // 조건에 따라 highlight 클래스를 추가
              >
                <span className="username">{item.sender}</span>
                <span className="msg_text">{item.body}</span>
                <span className="grid">{item.grid}</span>
              </div>
            ))}
          </div>
          {/* 메시지 입력창 */}
          {connected && (
            <div className="messenger-container">
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
                    name="grid"
                    id="grid"
                    placeholder="Grid"
                  />
                </div>
                <button className="chat_button" type="submit">
                  보내기
                </button>
              </form>
              <p>구독한 그리드에 존재하는 메세지 수</p>
              <textarea
            value={this.state.subscribeResponse}
            readOnly
            style={{ width: "100%", height: "100px", resize: "none" }}
          />
              <div>
                {/* 구독 정보 */}
                <p className="subscribe-text">그리드 구독</p>
                <p className="subscribe-info">
                  현재 구독중인 그리드: {this.state.nowSubscribed.join(", ")}
                </p>
                <p className="subscribe-info">
                  구독할 그리드: {this.state.subscribe.join(", ")}
                </p>
                <input
                  type="text"
                  onChange={this.onChange}
                  value={this.state.subscribeValue}
                  name="subscribeValue"
                  id="subscribe"
                  onKeyPress={this.handleSubscribeKeyPress}
                  placeholder="subscribe"
                  maxLength={1}
                />
                {/* 구독 추가 버튼 */}
                <button
                  className="subscribe_add_buttun"
                  type="button"
                  onClick={this.onAddClick}
                >
                  추가
                </button>
                {/* 구독 버튼 */}
                <button
                  className="subscribe_buttun"
                  type="button"
                  onClick={this.onSubscribeClick}
                >
                  구독
                </button>
              </div>
              <div>
                <p>그리드 메세지 조회</p>
                <textarea  
                  className="grid_message_search_result"     
                  value={this.state.searchResponse} 
                  readOnly
                  style={{ width: "100%", height: "100px", resize: "none" }}/>
                  <input                    
                type="text"
                onChange={this.onChange}
                value={this.state.searchGrid} // state의 searchGrid 값을 표시
                name="searchGrid"
                className="grid_message_search" 
                maxLength={1}
                onKeyPress={this.fetchMessagesByGrid}
                  />
                  <button
                    type="button"
                    className="grid_search_button"
                    onClick={this.fetchMessagesByGrid}
                  >조회</button>
              </div>
            </div>
          )}
        </div>
      );
    }
  }