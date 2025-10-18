#!/usr/bin/env python3
"""
FlowSpeak Backend API Testing Suite
Tests all CRUD operations for flowchart endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Use the production URL from frontend/.env
BASE_URL = "https://chartflow-4.preview.emergentagent.com/api"

class FlowSpeakAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_flowchart_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def test_health_check(self):
        """Test GET /api/ - Health check endpoint"""
        self.log("Testing health check endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "FlowSpeak API Ready" in data["message"]:
                    self.log("✅ Health check passed", "SUCCESS")
                    return True
                else:
                    self.log(f"❌ Health check failed - unexpected response: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Health check failed - status code: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_create_flowchart(self):
        """Test POST /api/flowcharts - Create a new flowchart"""
        self.log("Testing create flowchart endpoint...")
        
        # Sample payload as specified in the request
        payload = {
            "name": "Marketing Campaign Flow",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "task",
                    "label": "Define Target Audience",
                    "x": 100,
                    "y": 100,
                    "width": 180,
                    "height": 80,
                    "color": "#00A65A",
                    "locked": False,
                    "tabs": [
                        {
                            "id": "tab-1",
                            "label": "Details",
                            "content": [
                                {
                                    "id": "content-1",
                                    "type": "text",
                                    "content": "Research and define our target demographic for the campaign",
                                    "subtabs": []
                                }
                            ]
                        }
                    ],
                    "fields": {"done": False, "priority": "H"}
                },
                {
                    "id": "node-2",
                    "type": "decision",
                    "label": "Budget Approved?",
                    "x": 300,
                    "y": 100,
                    "width": 160,
                    "height": 80,
                    "color": "#F39C12",
                    "locked": False,
                    "tabs": [
                        {
                            "id": "tab-2",
                            "label": "Criteria",
                            "content": [
                                {
                                    "id": "content-2",
                                    "type": "text",
                                    "content": "Check if marketing budget has been approved by finance team",
                                    "subtabs": []
                                }
                            ]
                        }
                    ],
                    "fields": {}
                }
            ],
            "connections": [
                {
                    "id": "conn-1",
                    "from": "node-1",
                    "to": "node-2",
                    "label": "Next Step"
                }
            ]
        }
        
        try:
            response = self.session.post(f"{self.base_url}/flowcharts", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "name" in data:
                    self.test_flowchart_id = data["id"]
                    self.log(f"✅ Create flowchart passed - ID: {self.test_flowchart_id}", "SUCCESS")
                    
                    # Verify the data structure
                    if data["name"] == payload["name"] and len(data["nodes"]) == 2:
                        self.log("✅ Created flowchart data structure is correct", "SUCCESS")
                        return True
                    else:
                        self.log("❌ Created flowchart data structure mismatch", "ERROR")
                        return False
                else:
                    self.log(f"❌ Create flowchart failed - missing required fields: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Create flowchart failed - status code: {response.status_code}, response: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Create flowchart failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_get_all_flowcharts(self):
        """Test GET /api/flowcharts - Retrieve all flowcharts"""
        self.log("Testing get all flowcharts endpoint...")
        
        try:
            response = self.session.get(f"{self.base_url}/flowcharts")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log(f"✅ Get all flowcharts passed - found {len(data)} flowcharts", "SUCCESS")
                    
                    # Check if our created flowchart is in the list
                    if self.test_flowchart_id:
                        found = any(fc.get("id") == self.test_flowchart_id for fc in data)
                        if found:
                            self.log("✅ Created flowchart found in list", "SUCCESS")
                        else:
                            self.log("❌ Created flowchart not found in list", "ERROR")
                            return False
                    
                    return True
                else:
                    self.log(f"❌ Get all flowcharts failed - expected list, got: {type(data)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Get all flowcharts failed - status code: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get all flowcharts failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_get_specific_flowchart(self):
        """Test GET /api/flowcharts/{id} - Get specific flowchart by ID"""
        if not self.test_flowchart_id:
            self.log("❌ Cannot test get specific flowchart - no test flowchart ID", "ERROR")
            return False
            
        self.log(f"Testing get specific flowchart endpoint with ID: {self.test_flowchart_id}...")
        
        try:
            response = self.session.get(f"{self.base_url}/flowcharts/{self.test_flowchart_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == self.test_flowchart_id:
                    self.log("✅ Get specific flowchart passed", "SUCCESS")
                    
                    # Verify data integrity
                    if "nodes" in data and "connections" in data and "name" in data:
                        self.log("✅ Flowchart data structure is complete", "SUCCESS")
                        return True
                    else:
                        self.log("❌ Flowchart data structure incomplete", "ERROR")
                        return False
                else:
                    self.log(f"❌ Get specific flowchart failed - ID mismatch or missing: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Get specific flowchart failed - status code: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get specific flowchart failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_update_flowchart(self):
        """Test PUT /api/flowcharts/{id} - Update flowchart data"""
        if not self.test_flowchart_id:
            self.log("❌ Cannot test update flowchart - no test flowchart ID", "ERROR")
            return False
            
        self.log(f"Testing update flowchart endpoint with ID: {self.test_flowchart_id}...")
        
        update_payload = {
            "name": "Updated Marketing Campaign Flow",
            "nodes": [
                {
                    "id": "node-1",
                    "type": "task",
                    "label": "Updated: Define Target Audience",
                    "x": 150,
                    "y": 150,
                    "width": 200,
                    "height": 90,
                    "color": "#E74C3C",
                    "locked": False,
                    "tabs": [
                        {
                            "id": "tab-1",
                            "label": "Updated Details",
                            "content": [
                                {
                                    "id": "content-1",
                                    "type": "text",
                                    "content": "Updated: Research and define our target demographic with new insights",
                                    "subtabs": []
                                }
                            ]
                        }
                    ],
                    "fields": {"done": True, "priority": "M"}
                }
            ]
        }
        
        try:
            response = self.session.put(f"{self.base_url}/flowcharts/{self.test_flowchart_id}", json=update_payload)
            
            if response.status_code == 200:
                data = response.json()
                if data["name"] == update_payload["name"] and len(data["nodes"]) == 1:
                    self.log("✅ Update flowchart passed", "SUCCESS")
                    
                    # Verify the update was applied
                    if data["nodes"][0]["label"] == "Updated: Define Target Audience":
                        self.log("✅ Flowchart update data is correct", "SUCCESS")
                        return True
                    else:
                        self.log("❌ Flowchart update data mismatch", "ERROR")
                        return False
                else:
                    self.log(f"❌ Update flowchart failed - data mismatch: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Update flowchart failed - status code: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Update flowchart failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_delete_flowchart(self):
        """Test DELETE /api/flowcharts/{id} - Delete a flowchart"""
        if not self.test_flowchart_id:
            self.log("❌ Cannot test delete flowchart - no test flowchart ID", "ERROR")
            return False
            
        self.log(f"Testing delete flowchart endpoint with ID: {self.test_flowchart_id}...")
        
        try:
            response = self.session.delete(f"{self.base_url}/flowcharts/{self.test_flowchart_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data and data["deleted"] is True:
                    self.log("✅ Delete flowchart passed", "SUCCESS")
                    
                    # Verify deletion by trying to get the flowchart
                    verify_response = self.session.get(f"{self.base_url}/flowcharts/{self.test_flowchart_id}")
                    if verify_response.status_code != 200 or "error" in verify_response.json():
                        self.log("✅ Flowchart deletion verified", "SUCCESS")
                        return True
                    else:
                        self.log("❌ Flowchart still exists after deletion", "ERROR")
                        return False
                else:
                    self.log(f"❌ Delete flowchart failed - unexpected response: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Delete flowchart failed - status code: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Delete flowchart failed - exception: {str(e)}", "ERROR")
            return False
    
    def test_error_handling(self):
        """Test error handling for invalid IDs"""
        self.log("Testing error handling with invalid flowchart ID...")
        
        invalid_id = "invalid-flowchart-id-12345"
        
        try:
            # Test GET with invalid ID
            response = self.session.get(f"{self.base_url}/flowcharts/{invalid_id}")
            if response.status_code == 200:
                data = response.json()
                if "error" in data:
                    self.log("✅ Error handling for GET invalid ID works", "SUCCESS")
                else:
                    self.log("❌ Error handling for GET invalid ID failed - no error message", "ERROR")
                    return False
            else:
                self.log("✅ Error handling for GET invalid ID works (non-200 status)", "SUCCESS")
            
            # Test PUT with invalid ID
            update_data = {"name": "Test Update"}
            response = self.session.put(f"{self.base_url}/flowcharts/{invalid_id}", json=update_data)
            if response.status_code != 200:
                self.log("✅ Error handling for PUT invalid ID works", "SUCCESS")
            else:
                self.log("❌ Error handling for PUT invalid ID failed", "ERROR")
                return False
            
            # Test DELETE with invalid ID
            response = self.session.delete(f"{self.base_url}/flowcharts/{invalid_id}")
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data and data["deleted"] is False:
                    self.log("✅ Error handling for DELETE invalid ID works", "SUCCESS")
                    return True
                else:
                    self.log("❌ Error handling for DELETE invalid ID failed", "ERROR")
                    return False
            else:
                self.log("✅ Error handling for DELETE invalid ID works (non-200 status)", "SUCCESS")
                return True
                
        except Exception as e:
            self.log(f"❌ Error handling test failed - exception: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        self.log("=" * 60)
        self.log("Starting FlowSpeak Backend API Tests")
        self.log(f"Base URL: {self.base_url}")
        self.log("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Create Flowchart", self.test_create_flowchart),
            ("Get All Flowcharts", self.test_get_all_flowcharts),
            ("Get Specific Flowchart", self.test_get_specific_flowchart),
            ("Update Flowchart", self.test_update_flowchart),
            ("Delete Flowchart", self.test_delete_flowchart),
            ("Error Handling", self.test_error_handling)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n--- Running {test_name} Test ---")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} test crashed - exception: {str(e)}", "ERROR")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed! Backend APIs are working correctly.", "SUCCESS")
            return True
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Backend needs attention.", "ERROR")
            return False

if __name__ == "__main__":
    tester = FlowSpeakAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)