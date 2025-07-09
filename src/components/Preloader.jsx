"use client";

export default function Preloader({
  progress = 0,
  onComplete = null,
  loadingText = "Loading Portfolio",
}) {
  return (
    <div className="preloader-container">
      <div className="preloader-content">
        <div className="preloader-header">
          <div className="preloader-title">OLIVIER CARQUHAN</div>
          <div className="preloader-time">00:00 EST</div>
        </div>

        <div className="preloader-main">
          <div className="preloader-text">{loadingText}</div>

          <div className="preloader-progress">
            <div className="preloader-progress-bar">
              <div
                className="preloader-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="preloader-percentage">{Math.round(progress)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
