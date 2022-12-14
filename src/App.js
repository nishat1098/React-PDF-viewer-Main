import * as React from "react";
import {
  Worker,
  Viewer,
  Button,
  Position,
  PrimaryButton,
  Tooltip,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";
import { highlightPlugin, MessageIcon } from "@react-pdf-viewer/highlight";
import { useNavigate } from "react-router-dom";
import { OnHighlightKeyword } from "@react-pdf-viewer/search";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/bookmark/lib/styles/index.css";
import "@react-pdf-viewer/toolbar/lib/styles/index.css";
import { useEffect, useState } from "react";

import logo from "./logo.svg";

import axios from "axios";

function App() {
  const navigate = useNavigate();
  const noteSaver = [];

  // console.log(window.location);
  const searchParams = window.location.search
    .replace("?", "")
    .split("&")
    .map((param) => param.split("="))
    .reduce((values, [key, value]) => {
      values[key] = value;
      return values;
    }, {});

  // console.log(searchParams.file);
  const fileName = searchParams.file;
  const bookName = searchParams.book;
  const authorName = searchParams.author;
  const user = searchParams.user;
  const bookId = searchParams.bookId;
  // const token = searchParams.token;
  const token = "userTokenToAccessBook";

  const newBook =
    "http://192.168.1.143/uploads/books/" + fileName + "?test=blabla";
  const bookmarkPluginInstance = bookmarkPlugin();
  const [message, setMessage] = React.useState("");
  const [notes, setNotes] = React.useState([]);
  const notesContainerRef = React.useRef(null);
  let noteId = 0;
  if (notes.length) noteId = notes.length;
  const noteEles = new Map();

  const getAnswer = async () => {
    const { data } = await axios(
      "http://192.168.1.143:5000/api/v1/user/book/notes/" +
        user +
        "/" +
        fileName
    );
    // console.log(data, "from axios call");
    const dataArray = [];
    for (var i = 0; i < data.data.length; i++) {
      dataArray.push(data.data[i].note);
    }
    // console.log(dataArray, "its data array");
    setNotes(dataArray);
  };

  const updateRating = async () => {
    try {
      const { data } = await axios.post(
        "http://192.168.1.143:5000/api/v1/user/book/rateInc/" + bookId
      );
    } catch (err) {
      console.log(err, "Book Rating Update Error");
    }
  };

  useEffect(() => {
    getAnswer();
    updateRating();
  }, []);

  const transform = (slot) => ({
    ...slot,
    Download: () => <></>,
    DownloadMenuItem: () => <></>,
    Print: () => <></>,
    PrintMenuItem: () => <></>,
    Open: () => <></>,
    OpenMenuItem: () => <></>,
    SwitchTheme: () => <></>,
    SwitchThemeMenuItem: () => <></>,
  });

  const renderHighlightTarget = (props) => (
    <div
      style={{
        background: "#eee",
        display: "flex",
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: "translate(0, 8px)",
        zIndex: 1,
      }}
    >
      <Tooltip
        position={Position.TopCenter}
        target={
          <Button onClick={props.toggle}>
            <MessageIcon />
          </Button>
        }
        content={() => <div style={{ width: "100px" }}>Add a note</div>}
        offset={{ left: 0, top: -8 }}
      />
    </div>
  );
  var payload;
  const renderHighlightContent = (props) => {
    const addNote = () => {
      if (message !== "") {
        const note = {
          id: ++noteId,
          content: message,
          highlightAreas: props.highlightAreas,
          quote: props.selectedText,
        };
        payload = {
          userId: user,
          bookId: fileName,
          note: note,
        };
        noteSaver.push([note]);

        setNotes(notes.concat([note]));
        notes.push(note);

        // let bookTitle =
        // fileName.toString() + "_" + "notes_" + "noteID_" + note.id.toString();

        props.cancel();
        console.log(notes);
      }
    };

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0, 0, 0, .2)",
          borderRadius: "2px",
          padding: "8px",
          position: "fixed",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1,
        }}
      >
        <div>
          <textarea
            rows={3}
            style={{
              border: "1px solid rgba(0, 0, 0, .3)",
            }}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "8px",
          }}
        >
          <div style={{ marginRight: "8px" }}>
            <Button
              onClick={() => {
                addNote();
                saveNotesinLocal();
              }}
            >
              Add
            </Button>
          </div>
          <Button onClick={props.cancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  /* this is note save api call in the db */
  const saveNotesinLocal = async () => {
    try {
      await axios.post(
        "http://192.168.1.143:5000/api/v1/user/book/notes/save",
        payload
      );
    } catch (err) {
      console.log(err.response.message, "note save error");
    }
    localStorage.setItem(fileName.toString(), JSON.stringify(notes));
  };

  const jumpToNote = (note) => {
    const notesContainer = notesContainerRef.current;
    if (noteEles.has(note.id) && notesContainer) {
      notesContainer.scrollTop = noteEles
        .get(note.id)
        .getBoundingClientRect().top;
    }
  };

  const renderHighlights = (props) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, idx) => (
              <div
                key={idx}
                style={Object.assign(
                  {},
                  {
                    background: "yellow",
                    opacity: 0.4,
                  },
                  props.getCssProperties(area, props.rotation)
                )}
                onClick={() => jumpToNote(note)}
              />
            ))}
        </React.Fragment>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  React.useEffect(() => {
    return () => {
      noteEles.clear();
    };
  }, []);

  const sidebarNotes = (
    <div
      ref={notesContainerRef}
      style={{
        overflow: "auto",
        width: "100%",
      }}
    >
      {notes.length === 0 && (
        <div style={{ textAlign: "center" }}>There is no note</div>
      )}
      {notes.map((note) => {
        return (
          <div
            key={note.id}
            style={{
              borderBottom: "1px solid rgba(0, 0, 0, .3)",
              cursor: "pointer",
              padding: "8px",
            }}
            onClick={() => jumpToHighlightArea(note.highlightAreas[0])}
            ref={(ref) => {
              noteEles.set(note.id, ref);
            }}
          >
            <blockquote
              style={{
                borderLeft: "2px solid rgba(0, 0, 0, 0.2)",
                fontSize: ".75rem",
                lineHeight: 1.5,
                margin: "0 0 8px 0",
                paddingLeft: "8px",
                textAlign: "justify",
              }}
            >
              {note.quote}
            </blockquote>
            {note.content}
          </div>
        );
      })}
    </div>
  );

  const renderToolbar = (Toolbar) => (
    <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: (defaultTabs) =>
      defaultTabs.concat({
        content: sidebarNotes,
        icon: <MessageIcon />,
        title: "Notes",
      }),
    toolbarPlugin: {
      searchPlugin: {
        keyword: ["document"],
        onHighlightKeyword: (props) => {
          props.highlightEle.style.outline = "2px dashed red";
          props.highlightEle.style.backgroundColor = "rgba(0, 0, 0, 1)";
        },
      },
    },
  });
  const { renderDefaultToolbar } =
    defaultLayoutPluginInstance.toolbarPluginInstance;

  return (
    <div className="main">
      <nav className="nav shadow-sm mb-0">
        <div className="d-flex flex-row ml-1 flex-wrap">
          <a className="nav-link my-2" onClick={() => navigate(-1)}>
            <img src={logo} alt="Logo DMC" className="logo" />
          </a>
          <div className="nav-link my-2">
            <a className="home-button" onClick={() => navigate(-1)}>
              {" "}
              Home
            </a>

            <span className="book-name" onClick={() => navigate(-1)}>
              {"  / " + bookName}{" "}
            </span>
          </div>
        </div>
      </nav>
      <div className="">
        {/* View PDF */}

        <div className="viewer">
          {
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.12.313/build/pdf.worker.min.js">
              <Viewer
                fileUrl={newBook}
                httpHeaders={{
                  Authorization: `Bearer ${token}`,
                  // token: "Bearer blabla",
                }}
                // withCredentials={true}
                plugins={[
                  defaultLayoutPluginInstance,
                  bookmarkPluginInstance,
                  highlightPluginInstance,
                ]}
              ></Viewer>
            </Worker>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
