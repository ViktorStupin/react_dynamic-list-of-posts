import React, { useState, useEffect } from 'react';
import { Post } from '../types/Post';
import { Comment } from '../types/Comment';
import { client } from '../utils/fetchClient';
import { Loader } from './Loader';
import { NewCommentForm } from './NewCommentForm';

interface PostDetailsProps {
  post: Post | null;
}

export const PostDetails: React.FC<PostDetailsProps> = ({ post }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (!post) {
      setComments([]);
      setShowCommentForm(false);
      setError(null);
      setLoading(false);

      return;
    }

    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowCommentForm(false);
        const commentsData = await client.get<Comment[]>(
          `/comments?postId=${post.id}`,
        );

        setComments(commentsData);
      } catch (err) {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [post]);

  const handleAddComment = async (
    name: string,
    email: string,
    body: string,
  ) => {
    if (!post) {
      return;
    }

    try {
      const newComment = await client.post<Comment>('/comments', {
        postId: post.id,
        name,
        email,
        body,
      });

      setComments(prev => [...prev, newComment]);
    } catch (err) {
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      // Optimistic update
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      await client.delete(`/comments/${commentId}`);
    } catch (err) {
    }
  };

  if (!post) {
    return null;
  }

  return (
    <div className="content" data-cy="PostDetails">
      <div className="block">
        <h2 data-cy="PostTitle">
          #{post.id}: {post.title}
        </h2>
        <p data-cy="PostBody">{post.body}</p>
      </div>

      <div className="block">
        {loading && <Loader />}

        {error && (
          <div className="notification is-danger" data-cy="CommentsError">
            {error}
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <p className="title is-4" data-cy="NoCommentsMessage">
            No comments yet
          </p>
        )}

        {!loading && !error && comments.length > 0 && (
          <>
            <p className="title is-4">Comments:</p>
            {comments.map(comment => (
              <article
                key={comment.id}
                className="message is-small"
                data-cy="Comment"
              >
                <div className="message-header">
                  <a href={`mailto:${comment.email}`} data-cy="CommentAuthor">
                    {comment.name}
                  </a>
                  <button
                    data-cy="CommentDelete"
                    type="button"
                    className="delete is-small"
                    aria-label="delete"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    delete button
                  </button>
                </div>
                <div className="message-body" data-cy="CommentBody">
                  {comment.body}
                </div>
              </article>
            ))}
          </>
        )}

        {/* Показувати кнопку тільки якщо немає помилки, не завантажується і форма не відкрита */}
        {!loading && !error && !showCommentForm && (
          <button
            data-cy="WriteCommentButton"
            type="button"
            className="button is-link"
            onClick={() => setShowCommentForm(true)}
          >
            Write a comment
          </button>
        )}

        {showCommentForm && (
          <NewCommentForm
            onSubmit={handleAddComment}
            onCancel={() => setShowCommentForm(false)}
          />
        )}
      </div>
    </div>
  );
};
