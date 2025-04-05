import streamlit as st
import requests
import pandas as pd
import plotly.express as px

# Set page config
st.set_page_config(
    page_title="News Political Spectrum",
    page_icon="📰",
    layout="wide"
)

# App title and description
st.title("📰 News Political Spectrum")
st.markdown("""
This app fetches news from across the political spectrum using Perplexity's Sonar API.
Enter a topic to see diverse political viewpoints.
""")

# Sidebar
st.sidebar.header("About")
st.sidebar.info(
    "This application helps you explore news articles about a topic from different political perspectives. "
    "It categorizes sources as left-leaning, center, and right-leaning to give you a balanced view."
)

# Perplexity API information
st.sidebar.header("Perplexity API")
st.sidebar.markdown("""
1. Get your API key from [Perplexity AI](https://www.perplexity.ai/settings/api)
2. Your API key should start with `pplx-`
3. The key is only used for this session and not stored anywhere
""")

# Backend API URL
API_URL = "http://localhost:8000/query"

# Main form
with st.form("search_form"):
    # Query input
    query = st.text_input("Enter a news topic:", placeholder="climate change")
    
    # API Key input
    perplexity_api_key = st.text_input(
        "Enter your Perplexity API Key:", 
        type="password", 
        help="Get your API key from https://www.perplexity.ai/settings/api. It should start with 'pplx-'"
    )
    
    # Limit slider
    limit = st.slider("Number of results:", min_value=3, max_value=30, value=12, step=3)
    
    # Submit button
    submit_button = st.form_submit_button("Search")

# Function to get color based on political leaning
def get_color(leaning):
    if leaning == "left":
        return "#3b82f6"  # Blue
    elif leaning == "center":
        return "#a855f7"  # Purple
    elif leaning == "right":
        return "#ef4444"  # Red
    return "#6b7280"  # Gray for unknown

# Process form submission
if submit_button and query:
    if not perplexity_api_key:
        st.error("Please enter a valid Perplexity API key to continue.")
    elif not perplexity_api_key.startswith("pplx-"):
        st.error("Invalid API key format. Your Perplexity API key should start with 'pplx-'")
    else:
        with st.spinner("Fetching news from across the political spectrum..."):
            try:
                # Make request to the backend
                response = requests.post(
                    API_URL,
                    json={
                        "query": query,
                        "limit": limit,
                        "api_key": perplexity_api_key}
                )
                
                # Check for successful response
                if response.status_code == 200:
                    data = response.json()
                    
                    # Display statistics
                    st.subheader("Distribution of Sources")
                    stats = data.get("statistics", {})
                    
                    # Create a DataFrame for the pie chart
                    stats_df = pd.DataFrame({
                        "Political Leaning": ["Left", "Center", "Right"],
                        "Count": [
                            stats.get("left_count", 0),
                            stats.get("center_count", 0),
                            stats.get("right_count", 0)
                        ]
                    })
                    
                    # Create columns for stats and chart
                    col1, col2 = st.columns([1, 2])
                    
                    with col1:
                        st.metric("Total Sources", stats.get("total", 0))
                        st.metric("Left-leaning Sources", stats.get("left_count", 0))
                        st.metric("Center Sources", stats.get("center_count", 0))
                        st.metric("Right-leaning Sources", stats.get("right_count", 0))
                    
                    with col2:
                        # Create pie chart
                        fig = px.pie(
                            stats_df, 
                            values="Count", 
                            names="Political Leaning",
                            color="Political Leaning",
                            color_discrete_map={
                                "Left": "#3b82f6",
                                "Center": "#a855f7",
                                "Right": "#ef4444"
                            },
                            hole=0.4
                        )
                        fig.update_layout(margin=dict(t=0, b=0, l=0, r=0))
                        st.plotly_chart(fig, use_container_width=True)
                    
                    # Display articles in tabs based on political leaning
                    st.subheader("News Sources")
                    tabs = st.tabs(["All Sources", "Left-leaning", "Center", "Right-leaning"])
                    
                    # All sources
                    with tabs[0]:
                        for i, source in enumerate(data.get("sources", [])):
                            with st.container():
                                col1, col2 = st.columns([5, 1])
                                with col1:
                                    st.markdown(f"### [{source.get('title')}]({source.get('url')})")
                                    st.markdown(f"**Source:** {source.get('source_name')} • **Published:** {source.get('published_date', 'N/A')}")
                                    st.markdown(f"{source.get('snippet', '')}")
                                with col2:
                                    leaning = source.get('political_leaning', 'unknown')
                                    st.markdown(
                                        f"""
                                        <div style="
                                            background-color: {get_color(leaning)}; 
                                            color: white; 
                                            padding: 8px 12px; 
                                            border-radius: 20px; 
                                            text-align: center;
                                            margin-top: 20px;
                                        ">
                                            {leaning.capitalize()}
                                        </div>
                                        """, 
                                        unsafe_allow_html=True
                                    )
                                st.divider()
                    
                    # Left-leaning sources
                    with tabs[1]:
                        left_sources = [s for s in data.get("sources", []) if s.get("political_leaning") == "left"]
                        if left_sources:
                            for source in left_sources:
                                st.markdown(f"### [{source.get('title')}]({source.get('url')})")
                                st.markdown(f"**Source:** {source.get('source_name')} • **Published:** {source.get('published_date', 'N/A')}")
                                st.markdown(f"{source.get('snippet', '')}")
                                st.divider()
                        else:
                            st.info("No left-leaning sources found.")
                    
                    # Center sources
                    with tabs[2]:
                        center_sources = [s for s in data.get("sources", []) if s.get("political_leaning") == "center"]
                        if center_sources:
                            for source in center_sources:
                                st.markdown(f"### [{source.get('title')}]({source.get('url')})")
                                st.markdown(f"**Source:** {source.get('source_name')} • **Published:** {source.get('published_date', 'N/A')}")
                                st.markdown(f"{source.get('snippet', '')}")
                                st.divider()
                        else:
                            st.info("No center sources found.")
                    
                    # Right-leaning sources
                    with tabs[3]:
                        right_sources = [s for s in data.get("sources", []) if s.get("political_leaning") == "right"]
                        if right_sources:
                            for source in right_sources:
                                st.markdown(f"### [{source.get('title')}]({source.get('url')})")
                                st.markdown(f"**Source:** {source.get('source_name')} • **Published:** {source.get('published_date', 'N/A')}")
                                st.markdown(f"{source.get('snippet', '')}")
                                st.divider()
                        else:
                            st.info("No right-leaning sources found.")
                    
                elif response.status_code == 401:
                    st.error("Authentication failed: Invalid Perplexity API key. Please check your API key and try again.")
                else:
                    error_message = "An error occurred"
                    try:
                        error_data = response.json()
                        if "detail" in error_data:
                            error_message = error_data["detail"]
                    except:
                        error_message = response.text
                    
                    st.error(f"Error: {response.status_code} - {error_message}")
                    
            except requests.exceptions.ConnectionError:
                st.error("Connection error: Unable to connect to the backend server.")
                st.info("Make sure your FastAPI backend is running at http://localhost:8000")
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                st.info("Make sure your FastAPI backend is running at http://localhost:8000")
else:
    # Display initial state
    st.info("Enter a news topic and your Perplexity API key, then click 'Search' to get started!")

# Footer
st.markdown("---")
st.markdown("Built with Streamlit, FastAPI, and Perplexity Sonar API")