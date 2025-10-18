from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class TabContent(BaseModel):
    id: str
    type: str
    content: str
    subtabs: List['TabContent'] = []

class NodeTab(BaseModel):
    id: str
    label: str
    content: List[TabContent]

class NodeData(BaseModel):
    id: str
    type: str
    label: str
    x: float
    y: float
    width: float
    height: float
    color: str
    locked: bool
    lockTimer: int = None
    tabs: List[NodeTab]
    fields: dict = {}

class Connection(BaseModel):
    id: str
    fromNode: str = Field(alias="from")
    toNode: str = Field(alias="to")
    label: str = None

    class Config:
        populate_by_name = True

class FlowChart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str = "local"
    name: str = "Untitled Flow"
    nodes: List[NodeData] = []
    connections: List[Connection] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class FlowChartCreate(BaseModel):
    name: str = "Untitled Flow"
    nodes: List[NodeData] = []
    connections: List[Connection] = []

class FlowChartUpdate(BaseModel):
    name: str = None
    nodes: List[NodeData] = None
    connections: List[Connection] = None

# Update TabContent to support recursive subtabs
TabContent.model_rebuild()

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "FlowSpeak API Ready"}

# Flowchart endpoints
@api_router.post("/flowcharts", response_model=FlowChart)
async def create_flowchart(flowchart: FlowChartCreate):
    flow_obj = FlowChart(**flowchart.dict())
    await db.flowcharts.insert_one(flow_obj.dict())
    return flow_obj

@api_router.get("/flowcharts", response_model=List[FlowChart])
async def get_flowcharts():
    flowcharts = await db.flowcharts.find().to_list(100)
    return [FlowChart(**fc) for fc in flowcharts]

@api_router.get("/flowcharts/{flowchart_id}", response_model=FlowChart)
async def get_flowchart(flowchart_id: str):
    flowchart = await db.flowcharts.find_one({"id": flowchart_id})
    if not flowchart:
        return {"error": "Flowchart not found"}
    return FlowChart(**flowchart)

@api_router.put("/flowcharts/{flowchart_id}", response_model=FlowChart)
async def update_flowchart(flowchart_id: str, updates: FlowChartUpdate):
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.flowcharts.update_one(
        {"id": flowchart_id},
        {"$set": update_data}
    )
    
    flowchart = await db.flowcharts.find_one({"id": flowchart_id})
    return FlowChart(**flowchart)

@api_router.delete("/flowcharts/{flowchart_id}")
async def delete_flowchart(flowchart_id: str):
    result = await db.flowcharts.delete_one({"id": flowchart_id})
    return {"deleted": result.deleted_count > 0}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
