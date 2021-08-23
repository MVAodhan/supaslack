import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/Chat.module.css";
const Chat = ({ currentUser, session, supabase }) => {
  if (!currentUser) return null;
  const [editingUserName, setEditingUserName] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const message = useRef("");
  const newUsername = useRef("");
  useEffect(async () => {
    const getMessages = async () => {
      let { data: messages, error } = await supabase
        .from("message")
        .select("*");
      setMessages(messages);
    };

    await getMessages();

    const setUpMessagesSubscription = async () => {
      await supabase
        .from("message")
        .on("INSERT", (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();
    };
    await setUpMessagesSubscription();

    const setUpUserSubscription = async () => {
      await supabase
        .from("user")
        .on("UPDATE", (payload) => {
          setUsers((users) => {
            const user = users[payload.new.id];
            if (user) {
              return Object.assign({}, users, {
                [payload.new.id]: payload.new,
              });
            } else {
              return users;
            }
          });
        })
        .subscribe();
    };

    await setUpUserSubscription();
  }, []);

  const getUsersFromSupabase = async (users, userIds) => {
    const usersToGet = Array.from(userIds).filter((userId) => !users[userId]);
    if (Object.keys(users).length && usersToGet === 0) return users;

    const { data } = await supabase
      .from("user")
      .select("id, username")
      .in("id", usersToGet);

    const newUsers = {};
    data.forEach((user) => (newUsers[user.id] = user));
    return Object.assign({}, users, newUsers);
  };

  useEffect(async () => {
    const getUsers = async () => {
      const userIds = new Set(messages.map((message) => message.user_id));
      const newUsers = await getUsersFromSupabase(users, userIds);
      setUsers(newUsers);
    };
    await getUsers();
  }, [messages]);

  const handleMessage = async (e) => {
    e.preventDefault();

    const content = message.current.value;

    await supabase
      .from("message")
      .insert([{ content, user_id: session.user.id }]);

    message.current.value = "";
  };

  const logOut = (e) => {
    e.preventDefault();
    window.localStorage.clear();
    window.location.reload();
  };

  const setUsername = async (e) => {
    e.preventDefault();
    const username = newUsername.current.value;
    await supabase
      .from("user")
      .insert({ ...currentUser, username }, { upsert: true });
    newUsername.current.value = "";
    setEditingUserName(false);
  };

  const username = (user_id) => {
    const user = users[user_id];
    return user ? user.username : session.user.email.split("@")[0];
  };

  // console.log(messages);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>SupaSlack</h1>
          <p>
            Welcome :{" "}
            {currentUser.username ? currentUser.username : session.user.email}
          </p>
        </div>

        <div styles={styles.settings}>
          {editingUserName ? (
            <form onSubmit={setUsername}>
              <input type="text" placeholder="new username" ref={newUsername} />
              <button type="submit" />
            </form>
          ) : (
            <div className="editing-options">
              {" "}
              <button onClick={() => setEditingUserName(true)}>
                Edit userName
              </button>
              <button onClick={(e) => logOut(e)}>Log Out</button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.container}>
        {messages.map((message) => (
          <div className={styles.messageContainer} key={message.id}>
            <span className={styles.user}> {username(message.user_id)}</span>
            <div>{message.content}</div>
          </div>
        ))}
        <form className={styles.chat} onSubmit={handleMessage}>
          <input
            className={styles.messageInput}
            placeholder="your message"
            required
            ref={message}
          ></input>
          <button className={styles.submit} type="submit" />
        </form>
      </div>
    </>
  );
};

export default Chat;
