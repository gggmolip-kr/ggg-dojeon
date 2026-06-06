"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "gwamolip-wall-posts";

const emptyForm = {
  mediaType: "photo",
  mediaData: "",
  target: "",
  reason: "",
  book: "",
  instagram: "",
  name: "",
  friendAnswer: "네",
};

function formatDate(value) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const [form, setForm] = useState(emptyForm);
  const [entries, setEntries] = useState([]);
  const [notice, setNotice] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (error) {
        console.error("저장된 데이터를 읽지 못했습니다.", error);
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, isLoaded]);

  useEffect(() => {
    if (form.mediaType !== "photo") {
      const activeStream = videoRef.current?.srcObject;

      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      return;
    }

    let isCancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("웹캠을 열 수 없습니다.", error);
      }
    }

    startCamera();

    return () => {
      isCancelled = true;

      const activeStream = videoRef.current?.srcObject;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [form.mediaType]);

  useEffect(() => {
    if (form.mediaType !== "draw") {
      return;
    }

    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 4;
    context.strokeStyle = "#6b4d35";
  }, [form.mediaType]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  function updateForm(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleModeChange(nextType) {
    setForm((prev) => ({
      ...prev,
      mediaType: nextType,
      mediaData: "",
    }));
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;

    if (!video || !canvas || !video.videoWidth) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    updateForm("mediaData", canvas.toDataURL("image/png"));
  }

  function getCanvasPoint(event) {
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event) {
    const point = getCanvasPoint(event);
    isDrawingRef.current = true;
    lastPointRef.current = point;
  }

  function draw(event) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = drawCanvasRef.current;
    const context = canvas.getContext("2d");
    const point = getCanvasPoint(event);

    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();

    lastPointRef.current = point;
    updateForm("mediaData", canvas.toDataURL("image/png"));
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function resetDrawing() {
    const canvas = drawCanvasRef.current;
    const context = canvas.getContext("2d");

    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);

    updateForm("mediaData", "");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.mediaData || !form.target.trim() || !form.reason.trim() || !form.name.trim()) {
      setNotice("필수 항목을 먼저 채워주세요.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setForm(emptyForm);
    setNotice("과몰입 인증 완료!");
  }

  return (
    <main className="board-page">
      <section className="hero">
        <p className="hero-kicker">LOCAL FAN WALL</p>
        <h1>과몰입러 인증</h1>
        <p className="hero-text">
          좋아하는 마음을 종이에 적고, 사진이나 그림까지 붙여서 우리만의 게시판 벽을 채워보세요.
        </p>
      </section>

      <section className="board-layout">
        <div className="paper form-paper">
          <div className="tape tape-left" />
          <div className="tape tape-right" />

          <div className="paper-heading">
            <span className="badge">인증 종이 작성</span>
            <p>아래 내용을 적고 제출하면 오른쪽 벽에 바로 붙어요.</p>
          </div>

          <form className="cert-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label">1. 사진 또는 그림칸 *</label>
              <div className="choice-row">
                <button
                  type="button"
                  className={form.mediaType === "photo" ? "choice is-active" : "choice"}
                  onClick={() => handleModeChange("photo")}
                >
                  사진
                </button>
                <button
                  type="button"
                  className={form.mediaType === "draw" ? "choice is-active" : "choice"}
                  onClick={() => handleModeChange("draw")}
                >
                  그림
                </button>
              </div>

              {form.mediaType === "photo" ? (
                <div className="media-box">
                  <video ref={videoRef} className="camera-view" autoPlay playsInline muted />
                  <button type="button" className="action-button" onClick={capturePhoto}>
                    사진 찍기
                  </button>
                  <p className="helper-text">촬영 후 아래 미리보기에 들어가면 제출할 준비가 된 거예요.</p>
                </div>
              ) : (
                <div className="media-box">
                  <canvas
                    ref={drawCanvasRef}
                    className="draw-canvas"
                    width={320}
                    height={220}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <div className="mini-actions">
                    <button type="button" className="ghost-button" onClick={resetDrawing}>
                      다시 그리기
                    </button>
                  </div>
                  <p className="helper-text">마우스로 자유롭게 그려주세요.</p>
                </div>
              )}

              <canvas ref={captureCanvasRef} className="hidden-canvas" />

              <div className="preview-box">
                <span className="preview-title">미리보기</span>
                {form.mediaData ? (
                  <img src={form.mediaData} alt="인증 미리보기" className="preview-image" />
                ) : (
                  <div className="preview-empty">사진을 찍거나 그림을 그려주세요.</div>
                )}
              </div>
            </div>

            <label className="field">
              <span className="field-label">2. 내가 과몰입하는 대상 *</span>
              <input
                type="text"
                value={form.target}
                onChange={(event) => updateForm("target", event.target.value)}
                placeholder="예: 특정 캐릭터, 밴드, 야구팀, 소설 세계관"
              />
            </label>

            <label className="field">
              <span className="field-label">3. 과몰입하는 이유 *</span>
              <textarea
                value={form.reason}
                onChange={(event) => updateForm("reason", event.target.value)}
                placeholder="왜 좋아하게 되었는지 자유롭게 적어주세요."
                rows={4}
              />
            </label>

            <label className="field">
              <span className="field-label">4. 추천하고 싶은 책 또는 아무말</span>
              <textarea
                value={form.book}
                onChange={(event) => updateForm("book", event.target.value)}
                placeholder="책 추천이 없다면 오늘의 한마디를 적어도 좋아요."
                rows={3}
              />
            </label>

            <label className="field">
              <span className="field-label">5. 인스타그램 아이디</span>
              <input
                type="text"
                value={form.instagram}
                onChange={(event) => updateForm("instagram", event.target.value)}
                placeholder="@아이디"
              />
            </label>

            <label className="field">
              <span className="field-label">6. 이름 *</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="이름 또는 별명"
              />
            </label>

            <div className="field-group">
              <span className="field-label">7. 우리가 친구가 될 수 있을까요?</span>
              <div className="choice-row">
                <button
                  type="button"
                  className={form.friendAnswer === "네" ? "choice is-active" : "choice"}
                  onClick={() => updateForm("friendAnswer", "네")}
                >
                  네
                </button>
                <button
                  type="button"
                  className={form.friendAnswer === "아니오" ? "choice is-active" : "choice"}
                  onClick={() => updateForm("friendAnswer", "아니오")}
                >
                  아니오
                </button>
              </div>
            </div>

            <div className="submit-row">
              <button type="submit" className="submit-button">
                인증 종이 붙이기
              </button>
              {notice ? <p className="notice">{notice}</p> : null}
            </div>
          </form>
        </div>

        <div className="wall-panel">
          <div className="wall-title">
            <span className="badge">과몰입러의 벽</span>
            <h2>우리의 인증 종이 게시판</h2>
            <p>제출한 종이는 브라우저에 저장되어 새로고침 후에도 그대로 남아 있어요.</p>
          </div>

          <div className="wall-grid">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <article
                  key={entry.id}
                  className="paper wall-paper"
                  style={{ transform: `rotate(${index % 2 === 0 ? -1.4 : 1.2}deg)` }}
                >
                  <div className="tape tape-center" />
                  <img
                    src={entry.mediaData}
                    alt={`${entry.name}의 인증 이미지`}
                    className="wall-image"
                  />
                  <div className="wall-content">
                    <h3>{entry.name}</h3>
                    <p>
                      <strong>과몰입 대상</strong>
                      {entry.target}
                    </p>
                    <p>
                      <strong>이유</strong>
                      {entry.reason}
                    </p>
                    <p>
                      <strong>추천 책 / 한마디</strong>
                      {entry.book || "아직 비밀이에요."}
                    </p>
                    <p>
                      <strong>인스타</strong>
                      {entry.instagram || "없음"}
                    </p>
                    <p>
                      <strong>친구 가능 여부</strong>
                      {entry.friendAnswer}
                    </p>
                    <p>
                      <strong>작성 시간</strong>
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-wall">
                <p>아직 붙은 종이가 없어요.</p>
                <p>첫 번째 과몰입 인증을 남겨보세요.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
