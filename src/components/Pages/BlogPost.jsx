import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../App";
import { getPost } from "./blog/posts";
import "./Blog.css";

const ORIGIN = "https://restcoderacademy.in";

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function Block({ block }) {
  if (block.t === "h2") return <h2>{block.c}</h2>;
  if (block.t === "ul") {
    return (
      <ul>
        {block.c.map((li, i) => (
          <li key={i}>{li}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.c}</p>;
}

function BlogPost() {
  const { slug } = useParams();
  const { openModal } = useAuth();
  const post = getPost(slug);
  if (!post) return <Navigate to="/blog" replace />;

  const url = `${ORIGIN}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author || "Rest Coder Academy" },
    publisher: { "@type": "EducationalOrganization", name: "Rest Coder Academy", "@id": `${ORIGIN}/#org` },
    mainEntityOfPage: url,
    url,
  };

  const title = `${post.title} | Rest Coder Academy`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={post.description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={post.description} url={url} type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="bl">
        <nav className="bl-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/blog">Blog</Link>
        </nav>

        <article className="bl-post">
          <header>
            <div className="bl-meta">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>·</span>
              <span>{post.readMinutes} min read</span>
            </div>
            <h1>{post.title}</h1>
          </header>
          <div className="bl-body">
            {post.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </article>

        <section className="bl-cta">
          <h2>Thinking about a course?</h2>
          <p>Our Java, Python and MERN full-stack courses are live, project-based, and built around real placements.</p>
          <div className="bl-cta-row">
            <button className="bl-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="bl-btn bl-btn--ghost" to="/">See our courses</Link>
            <Link className="bl-back" to="/blog">← More posts</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default BlogPost;
