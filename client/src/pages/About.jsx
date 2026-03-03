import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-banner" />
      <h1>About Converse Corner</h1>
      <p className="lead">
        Converse Corner is a modern web application that lets you showcase your skills,
        connect with peers, and send messages. Timestamps are shown in Indian Standard Time (IST).
      </p>

      <section>
        <h2>Features</h2>
        <ul>
          <li><strong>User Authentication:</strong> Register, log in, and log out securely.</li>
          <li><strong>Skills Management:</strong> Add, view, and delete skills with levels and descriptions.</li>
          <li><strong>Messaging System:</strong> Send and receive messages between users.</li>
          <li><strong>Dashboard:</strong> Quick overview of your skills and recent messages.</li>
          <li><strong>Browse Skills:</strong> Discover skills from other users.</li>
        </ul>
      </section>

      <section>
        <h2>Technologies</h2>
        <ul>
          <li><strong>Frontend:</strong> React.js, React Router</li>
          <li><strong>Backend:</strong> Express.js, Node.js</li>
          <li><strong>Database:</strong> MongoDB with Mongoose</li>
          <li><strong>Auth:</strong> JWT (JSON Web Tokens)</li>
        </ul>
      </section>
    </div>
  );
}
