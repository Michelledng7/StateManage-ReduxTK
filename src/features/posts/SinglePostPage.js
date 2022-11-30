import { useSelector } from 'react-redux';
import { selectPostById } from './postSlice';
import PostAuthor from './PostAuthor';
import TimeAgo from './TimeAgo';
import { Link } from 'react-router-dom';
import ReactionButtons from './ReactionButtons';
import { useParams } from 'react-router-dom';

const SinglePostPage = () => {
	const { postId } = useParams();
	const post = useSelector((state) => selectPostById(state, Number(postId)));
	console.log(post);

	if (!post) {
		return (
			<section>
				<h2>Post not found!</h2>
			</section>
		);
	}
	return (
		<article>
			<h2>{post.title}</h2>
			<p>{post.body}</p>
			<p className='postCredit'>
				<Link to={`/posts/edit/${post.id}`}>Edit Post </Link>
				<PostAuthor userId={post.userId} />
				<TimeAgo timestamp={post.date} />
			</p>
			<ReactionButtons post={post} />
		</article>
	);
};

export default SinglePostPage;
