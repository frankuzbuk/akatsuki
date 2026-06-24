"""Seed demo anime data"""
import os
from dotenv import load_dotenv
from pathlib import Path
import asyncio
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

DEMO_ANIME = [
    {
        "title": "Demon Slayer",
        "title_english": "Demon Slayer: Kimetsu no Yaiba",
        "title_japanese": "鬼滅の刃",
        "description": "Tanjiro Kamado, a kind-hearted boy who sells charcoal for a living, finds his family slaughtered by demons. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. To save his sister and avenge his family, Tanjiro joins the Demon Slayer Corps.",
        "genres": ["Action", "Supernatural", "Adventure"],
        "year": 2019,
        "status": "ongoing",
        "rating": 8.7,
        "cover_image": "https://cdn.pixabay.com/photo/2022/12/01/04/40/backpacker-7628303_1280.jpg",
        "banner_image": "https://images.unsplash.com/photo-1581436670376-f152b9e3b5ec",
        "total_episodes": 50
    },
    {
        "title": "Attack on Titan",
        "title_english": "Attack on Titan",
        "title_japanese": "進撃の巨人",
        "description": "When man-eating Titans first appeared 100 years ago, humans found safety behind massive walls that stopped the giants in their tracks. But the safety they have had for so long is threatened when a colossal Titan smashes through the barriers.",
        "genres": ["Action", "Drama", "Fantasy"],
        "year": 2013,
        "status": "completed",
        "rating": 9.0,
        "cover_image": "https://cdn.pixabay.com/photo/2024/07/08/05/41/girl-8880144_640.png",
        "banner_image": "https://images.unsplash.com/photo-1677143016687-8dbb7e71db08",
        "total_episodes": 87
    },
    {
        "title": "Jujutsu Kaisen",
        "title_english": "Jujutsu Kaisen",
        "title_japanese": "呪術廻戦",
        "description": "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
        "genres": ["Action", "Supernatural", "School"],
        "year": 2020,
        "status": "ongoing",
        "rating": 8.6,
        "cover_image": "https://cdn.pixabay.com/photo/2023/12/07/11/11/girl-8435339_640.png",
        "banner_image": "https://images.unsplash.com/photo-1708034677699-6f39d9c59f6e",
        "total_episodes": 47
    },
    {
        "title": "One Piece",
        "title_english": "One Piece",
        "title_japanese": "ワンピース",
        "description": "Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates. With a course charted for the treacherous waters of the Grand Line, this is one captain who'll never give up until he's claimed the greatest treasure on Earth - the Legendary One Piece!",
        "genres": ["Action", "Adventure", "Comedy"],
        "year": 1999,
        "status": "ongoing",
        "rating": 9.1,
        "cover_image": "https://cdn.pixabay.com/photo/2022/12/01/04/43/girl-7628308_640.jpg",
        "banner_image": "https://images.unsplash.com/photo-1766043650776-e71079fd4d3f",
        "total_episodes": 1000
    },
    {
        "title": "Naruto",
        "title_english": "Naruto",
        "title_japanese": "ナルト",
        "description": "Twelve years before the start of the series, the Nine-Tails attacked Konohagakure destroying much of the village. The Fourth Hokage sacrificed his life to seal the Nine-Tails into a newborn Naruto Uzumaki.",
        "genres": ["Action", "Adventure", "Supernatural"],
        "year": 2002,
        "status": "completed",
        "rating": 8.4,
        "cover_image": "https://cdn.pixabay.com/photo/2024/05/26/15/27/anime-8788959_640.jpg",
        "banner_image": "https://images.unsplash.com/photo-1755973707174-47be69f3d037",
        "total_episodes": 220
    },
    {
        "title": "My Hero Academia",
        "title_english": "My Hero Academia",
        "title_japanese": "僕のヒーローアカデミア",
        "description": "In a world where people with superpowers (known as 'Quirks') are the norm, Izuku Midoriya has dreams of one day becoming a Hero, despite being bullied by his classmates for not having a Quirk.",
        "genres": ["Action", "Comedy", "School"],
        "year": 2016,
        "status": "ongoing",
        "rating": 8.3,
        "cover_image": "https://cdn.pixabay.com/photo/2023/12/07/11/04/girl-8435329_1280.png",
        "banner_image": "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9",
        "total_episodes": 138
    },
    {
        "title": "Death Note",
        "title_english": "Death Note",
        "title_japanese": "デスノート",
        "description": "An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it.",
        "genres": ["Mystery", "Thriller", "Supernatural"],
        "year": 2006,
        "status": "completed",
        "rating": 9.0,
        "cover_image": "https://cdn.pixabay.com/photo/2024/08/01/18/20/anime-8937917_1280.png",
        "banner_image": "https://images.unsplash.com/photo-1640903581708-8d491706515b",
        "total_episodes": 37
    },
    {
        "title": "Spy x Family",
        "title_english": "Spy x Family",
        "title_japanese": "スパイファミリー",
        "description": "A spy who has to build a family to execute a mission discovers that the daughter he adopts is a telepath, and the woman he agrees to be in a marriage of convenience with is a skilled assassin.",
        "genres": ["Comedy", "Action", "Slice of Life"],
        "year": 2022,
        "status": "ongoing",
        "rating": 8.5,
        "cover_image": "https://cdn.pixabay.com/photo/2024/08/01/18/20/anime-8937914_1280.png",
        "banner_image": "https://images.unsplash.com/photo-1581436670376-f152b9e3b5ec",
        "total_episodes": 25
    },
    {
        "title": "Chainsaw Man",
        "title_english": "Chainsaw Man",
        "title_japanese": "チェンソーマン",
        "description": "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality. With a dead father and a chainsaw devil named Pochita as his only friend, Denji is the textbook definition of poor.",
        "genres": ["Action", "Horror", "Supernatural"],
        "year": 2022,
        "status": "ongoing",
        "rating": 8.7,
        "cover_image": "https://images.unsplash.com/photo-1668293750324-bd77c1f08ca9",
        "banner_image": "https://images.unsplash.com/photo-1677143016687-8dbb7e71db08",
        "total_episodes": 12
    },
    {
        "title": "Tokyo Revengers",
        "title_english": "Tokyo Revengers",
        "title_japanese": "東京リベンジャーズ",
        "description": "Watching the news, Takemichi Hanagaki learns that his girlfriend from way back in middle school, Hinata Tachibana, has died. The 26-year-old Takemichi is living in a crappy apartment, a virgin, working part-time with a kohai 5 years younger than him as his boss.",
        "genres": ["Action", "Drama", "Supernatural"],
        "year": 2021,
        "status": "completed",
        "rating": 8.1,
        "cover_image": "https://images.unsplash.com/photo-1640903581708-8d491706515b",
        "banner_image": "https://images.unsplash.com/photo-1708034677699-6f39d9c59f6e",
        "total_episodes": 24
    }
]

async def seed():
    # Clear existing anime
    await db.anime.delete_many({})
    await db.episodes.delete_many({})
    
    # Create anime
    anime_ids = []
    for i, anime_data in enumerate(DEMO_ANIME):
        anime_id = str(uuid.uuid4())
        anime_doc = {
            "id": anime_id,
            **anime_data,
            "view_count": (10 - i) * 1000 + 500,  # First items have more views
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.anime.insert_one(anime_doc)
        anime_ids.append((anime_id, anime_data["title"]))
        print(f"Created anime: {anime_data['title']}")
    
    # Create episodes for each anime
    for anime_id, title in anime_ids:
        for ep_num in range(1, 6):  # 5 episodes per anime
            episode_id = str(uuid.uuid4())
            episode_doc = {
                "id": episode_id,
                "anime_id": anime_id,
                "episode_number": ep_num,
                "title": f"Episode {ep_num}",
                "description": f"This is episode {ep_num} of {title}.",
                "video_url": None,
                "thumbnail": None,
                "duration": 1440,  # 24 minutes
                "view_count": 0,
                "created_at": datetime.now(timezone.utc)
            }
            await db.episodes.insert_one(episode_doc)
        print(f"Created 5 episodes for: {title}")
    
    print(f"\nSeeded {len(DEMO_ANIME)} anime with {len(DEMO_ANIME) * 5} episodes")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
