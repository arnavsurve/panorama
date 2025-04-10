<img width="800" alt="Screenshot 2025-04-06 at 4 49 42 AM" src="https://github.com/user-attachments/assets/3272ebb5-8cce-410b-9b52-e3a70ea01c78" />

# 📰 Panorama - News Across the Political Spectrum (SF Hacks 2025)

Panorama is a full-stack multi-partisan search engine for live news with labeled biases. The application categorizes news sources as left-leaning, center, or right-leaning, providing a balanced view of how different outlets are covering the same topics.

## Features

- **News Aggregation**: Search for any topic and get articles from across the political spectrum
- **Political Balance**: Articles are categorized as left-leaning, center, or right-leaning
- **Article Details**: View full article content, metadata, and summaries
- **Follow-up Questions**: Ask questions about articles and get AI-generated answers
- **User Accounts**: Register, login, and manage your profile
- **Search History**: Keep track of your previous searches
- **Bookmarks**: Save articles for later reading
- **Theme Selection**: Toggle between light and dark modes

## Tech Stack

### Backend
- **FastAPI**: Python web framework for building APIs
- **MongoDB**: NoSQL database for storing articles, user data, and search history
- **Motor**: Asynchronous MongoDB driver
- **BeautifulSoup**: Web scraping library
- **OpenAI Integration**: AI-powered article summarization and question answering
- **Perplexity API**: News search capabilities

### Frontend
- **React**: JavaScript library for building user interfaces
- **React Router**: Navigation and routing
- **TailwindCSS**: Utility-first CSS framework
- **React Icons**: Icon library
- **React Markdown**: Markdown rendering for article content

## Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB
- API keys for OpenAI and Perplexity

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/panorama.git
   cd panorama
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   MONGODB_URL=your_mongodb_connection_string
   ```

4. Start the backend server:
   ```bash
   uvicorn api:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Register for an account or log in if you already have one
2. Enter a search query in the search bar
3. Browse articles from different political perspectives
4. Click on an article to read its full content
5. Ask follow-up questions about articles
6. Bookmark articles for later reading
7. Access your search history from the settings menu

## API Endpoints

The backend provides the following main endpoints:

- `POST /query`: Search for news articles
- `GET /source/{source_id}`: Get details for a specific article
- `POST /followup/{source_id}`: Ask a follow-up question about an article
- `POST /multi_followup`: Ask a question across multiple articles
- `POST /register`: Create a new user account
- `POST /login`: Log in to an existing account
- `GET /user/{user_id}/history`: Get a user's search history
- `DELETE /user/{user_id}/history`: Clear a user's search history
- `POST /bookmark`: Save an article to a user's bookmarks
- `GET /user/{user_id}/bookmarks`: Get a user's bookmarked articles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenAI](https://openai.com/) for the AI capabilities
- [Perplexity](https://www.perplexity.ai/) for the search API
- [MongoDB](https://www.mongodb.com/) for the database
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend library
- [TailwindCSS](https://tailwindcss.com/) for the styling
