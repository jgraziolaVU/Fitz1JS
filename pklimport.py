import pickle
with open('filename.pkl', 'rb') as f:
    data = pickle.load(f)
print(type(data))
print(list(data.keys()) if isinstance(data, dict) else data[:5])
