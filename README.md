
# CNZ Shopping



# How to run the chatbot:

### 01: Set Up Virtual Environment
run these commands in the terminal (make shure that you are inside the project directory):

```bash
    python -m venv venv
    source venv/bin/activate
```

### 02: Set Up .env 
create a file called .env inside the project, and add the following code

```bash
   OPENAI_API_KEY="your-api-key-here" # replace with api key
   SERPAPI_KEY="your-api-key-here"
   HTTP_PORT=5899  
```

### 03: Start HTTP Server

run:
```bash
./scripts/run.sh
```

wait a min for the dependences to install, then open the port that is provided to you in the terminal, message should say something like:

```bash
 [INFO] Listening at: http://0.0.0.0:5899 (40666)
```
