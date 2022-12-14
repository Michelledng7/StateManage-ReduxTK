import {
	createSlice,
	createAsyncThunk,
	createSelector,
	createEntityAdapter,
} from '@reduxjs/toolkit';
import { sub } from 'date-fns';
import axios from 'axios';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

const postsAdapter = createEntityAdapter({
	sortComparer: (a, b) => b.date.localeCompare(a.date), //take the logic out of the component
});

const initialState = postsAdapter.getInitialState({
	status: 'idle',
	error: null,
});

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
	const response = await axios.get(POSTS_URL);
	console.log(response.data);
	return response.data;
});

export const addNewPost = createAsyncThunk(
	'posts/addNewPost',
	async (initialPost) => {
		try {
			const response = await axios.post(POSTS_URL, initialPost);
			return response.data;
		} catch (error) {
			return error.message;
		}
	}
);

export const updatePost = createAsyncThunk(
	'posts/updatePost',
	async (initialPost) => {
		const { id } = initialPost;
		try {
			const response = await axios.put(`{POSTS_URL}/${id}`, initialPost);
			console.log(response.data);
			return response.data;
		} catch (error) {
			//return error.message;
			console.log(initialPost);
			return initialPost; //for testing
		}
	}
);

export const deletePost = createAsyncThunk(
	'posts/deletePost',
	async (initialPost) => {
		const { id } = initialPost;
		try {
			const response = await axios.delete(`${POSTS_URL}/${id}`);
			if (response?.status === 200) return initialPost;
			return response?.statusText;
		} catch (err) {
			return err.message;
		}
	}
);

const postsSlice = createSlice({
	name: 'posts',
	initialState,
	reducers: {
		// postAdded: {
		// 	reducer(state, action) {
		// 		state.posts.push(action.payload);
		// 	},
		// 	prepare(title, content, userId) {
		// 		return {
		// 			payload: {
		// 				id: nanoid(),
		// 				title,
		// 				content,
		// 				date: new Date().toISOString(),
		// 				userId,
		// 				reactions: {
		// 					thumbsUp: 0,
		// 					wow: 0,
		// 					heart: 0,
		// 					rocket: 0,
		// 					coffee: 0,
		// 				},
		// 			},
		// 		};
		// 	},
		// },
		reactionReducer(state, action) {
			const { postId, reaction } = action.payload;
			const existingPost = state.entities[postId];
			if (existingPost) {
				existingPost.reactions[reaction]++;
			}
		},
	},
	extraReducers(builder) {
		builder
			.addCase(fetchPosts.pending, (state, action) => {
				state.status = 'loading';
			})
			.addCase(fetchPosts.fulfilled, (state, action) => {
				state.status = 'succeeded';
				//adding date and reactions to the fetched posts
				let min = 1;
				const loadedPosts = action.payload.map((post) => {
					post.date = sub(new Date(), { minutes: min++ }).toISOString();
					post.reactions = {
						thumbsUp: 0,
						wow: 0,
						heart: 0,
						rocket: 0,
						coffee: 0,
					};
					return post;
				});
				//add fetched posts to the array
				//state.posts = state.posts.concat(loadedPosts);
				postsAdapter.upsertMany(state, loadedPosts);
			})
			.addCase(fetchPosts.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.error.message;
			})
			.addCase(addNewPost.fulfilled, (state, action) => {
				action.payload.userId = Number(action.payload.userId);
				action.payload.date = new Date().toISOString();
				action.payload.reactions = {
					thumbsUp: 0,
					wow: 0,
					heart: 0,
					rocket: 0,
					coffee: 0,
				};
				console.log(action.payload);
				//state.posts.push(action.payload);
				postsAdapter.addOne(state, action.payload);
			})
			.addCase(updatePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log('update not completed');
					console.log(action.payload);
					return;
				}
				//const { id } = action.payload;
				action.payload.date = new Date().toISOString();
				//const posts = state.posts.filter((post) => post.id !== id);
				console.log(action.payload);
				//state.posts = [...posts, action.payload];
				postsAdapter.upsertOne(state, action.payload);
			})
			.addCase(deletePost.fulfilled, (state, action) => {
				if (!action.payload?.id) {
					console.log('delete not completed');
					console.log(action.payload);
					return;
				}
				const { id } = action.payload;
				//const posts = state.posts.filter((post) => post.id !== Number(id));
				//	state.posts = posts;
				postsAdapter.removeOne(state, id);
				console.log(id);
			});
	},
});

//getSelectors creates below selectors and rename them with preexisting names using destructuring
export const {
	selectAll: selectAllPosts,
	selectById: selectPostById,
	selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts);

//export const selectAllPosts = (state) => state.posts.posts;
export const getPostsStatus = (state) => state.posts.status;
export const getPostsError = (state) => state.posts.error;

// export const selectPostById = (state, postId) =>
// 	state.posts.posts.find((post) => post.id === postId);
//memoized selector for performance improvement
export const selectPostsByUser = createSelector(
	[selectAllPosts, (state, userId) => userId],
	(posts, userId) => posts.filter((post) => post.userId === userId)
);

export const { postAdded, reactionReducer } = postsSlice.actions;

export default postsSlice.reducer;
