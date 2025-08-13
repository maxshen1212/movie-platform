import { Client, Databases, Query, ID } from "appwrite";

// 載入環境變數
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// 初始化 Appwrite 客戶端
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(PROJECT_ID);

// 初始化 Appwrite 資料庫
const database = new Databases(client);

// 更新搜尋次數
export const updateSearchCount = async (searchTerm, movie) => {
  try {
    // 1. Use Appwrite's SDK to check if the search term exists in the database
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    // 2. If it exists, increment the count
    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
      });
    }
    // 3. If it doesn't exist, create a new document with count set to 1
    else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
  }
};

// 獲取最熱門電影
export const getTrendingMovies = async () => {
  try {
    const results = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);
    return results.documents || [];
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};
