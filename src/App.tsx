import JsonEditor from "./components/jsonEditor"

function App() {
const handleJsonChange = (jsonString: string) => {
    // Bạn có thể làm gì đó với chuỗi JSON mới ở đây
    // console.log("JSON updated:", jsonString);
  };

  const initialJson = `{
  "name": "John Doe",
  "age": 30,
  "isStudent": false,
  "courses": [
    { "title": "History", "credits": 3 },
    { "title": "Math", "credits": 4 }
  ],
  "address": null
}`;
  return (
<div className="bg-gray-900 h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="max-w-5xl w-full max-h-[800px] flex-1">
        <JsonEditor 
          initialValue={initialJson}
          onChange={handleJsonChange} 
        />
      </div>
    </div>
  )
}

export default App
