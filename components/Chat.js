import { useEffect, useRef, useState } from "react";
import styles from "../styles/Chat.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

const Chat = ({ currentUser, supabase, session }) => {
  const [messages, setMessages] = useState([]);
  const [editingUsername, setEditingUsername] = useState(false);
  const message = useRef("");
  const newUsername = useRef("");
  const [users, setUsers] = useState({});

  useEffect(() => {
    const getMessages = async () => {
      let { data: messages, error } = await supabase
        .from("message")
        .select("*");

      setMessages(messages);
    };

    getMessages();

    const setupMessagesSubscription = async () => {
      await supabase
        .channel("custom-insert-channel")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "message" },
          (payload) => {
            setMessages((previous) => [...previous, payload.new]);
            console.log("Change received!", payload);
          }
        )
        .subscribe();
    };

    setupMessagesSubscription();

    const setupUsersSubscription = async () => {
      await supabase
        .channel("custom-update-channel")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "user" },
          (payload) => {
            setUsers((prev) => {
              const user = prev[payload.new.id];
              if (user) {
                return { ...prev, [payload.new.id]: payload.new };
              } else {
                return prev;
              }
            });
            console.log(
              "🚀 ~ file: Chat.js:58 ~ setupUsersSubscription ~ payload:",
              payload
            );
          }
        )
        .subscribe();
    };

    setupUsersSubscription();
  }, [supabase]);

  useEffect(() => {
    if (currentUser) {
      setUsers((prev) => {
        const user = prev[currentUser.id];
        if (user) {
          return { ...prev, [currentUser.id]: currentUser };
        } else {
          return prev;
        }
      });
    }
  }, [currentUser]);

  const getUsersFromSupabase = async (users, userIds) => {
    const newUsersIds = Array.from(userIds).filter((id) => !users[id]);

    if (Object.keys(users).length && !newUsersIds.length) return users;

    const { data } = await supabase
      .from("user")
      .select("id, username")
      .in("id", newUsersIds);

    const newUsers = {};
    data.forEach((user) => {
      newUsers[user.id] = user;
    });

    return { ...users, ...newUsers };
  };

  useEffect(() => {
    const getUsers = async () => {
      const userIds = new Set(messages.map((message) => message.user_id));
      const newUsers = await getUsersFromSupabase(users, userIds);
      setUsers(newUsers);
    };

    getUsers();
  }, [messages]);

  if (!currentUser) return <p>...Loading</p>;

  const sendMessage = async (e) => {
    e.preventDefault();

    const content = message.current.value;

    await supabase
      .from("message")
      .insert([{ content, user_id: session.user.id }]);

    message.current.value = "";
  };

  const setUsername = async (e) => {
    e.preventDefault();
    const username = newUsername.current.value;
    await supabase.from("user").update({ username }).eq("id", currentUser.id);
    newUsername.current.value = "";
    setEditingUsername(false);
  };

  const logout = async (evt) => {
    evt.preventDefault();
    window.localStorage.clear();
    window.location.reload();
    // supabase.auth.signOut();
  };

  const username = (id) => {
    const user = users[id];
    if (!user) return "";
    return user.username ? user.username : user.id;
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>Supabase Chat</h1>
          <p>
            Welcome{" "}
            {currentUser.username ? currentUser.username : session.user.email}
          </p>
        </div>
        <div className={styles.settings}>
          {editingUsername ? (
            <form onSubmit={setUsername}>
              <input
                placeholder="new username"
                required
                ref={newUsername}
              ></input>
              <button type="submit">Update username</button>
            </form>
          ) : (
            <div>
              <button onClick={() => setEditingUsername(true)}>
                Edit username
              </button>
            </div>
          )}
          <button onClick={logout}>Log out</button>
        </div>
      </div>
      <div className={styles.container}>
        {messages.map((message) => (
          <div className={styles.messageContainer} key={message.id}>
            <span
              className={
                message.user_id === currentUser.id ? styles.you : styles.user
              }
            >
              {username(message.user_id)}
            </span>
            <ReactMarkdown remarkPlugins={[gfm]} linkTarget={"_blank"}>
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        <form className={styles.chat} onSubmit={sendMessage}>
          <input
            className={styles.messageInput}
            placeholder="Write your message"
            required
            ref={message}
          ></input>
          <button className={styles.submit} type="submit">
            Send message
          </button>
        </form>
      </div>
    </>
  );
};

export default Chat;
