import '../css/theme.css';
import './submitPolicy.css';

export default function SubmitPolicy() {
  return (
    <div className="submit-wrap">
      {/* <h2>Submit&nbsp;Your&nbsp;Policy&nbsp;for&nbsp;Evaluation</h2>

      <p className="submit-blurb">
        Fill out the form below with details of your policy. Once approved,
        you’ll receive instructions for uploading your container to
        RoboArena&CloseCurlyQuote;s evaluation cluster.
      </p> */}

      {/*  ——  embedded Google Form  ——  */}
      <iframe
        title="RoboArena policy submission form"
        className="submit-iframe"
        src="https://docs.google.com/forms/d/e/1FAIpQLSdMJ0ja1wCubwYAiyyhXyBxxRIVeU3YUD9I3nN4cJUASrxhHg/viewform?embedded=true"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
