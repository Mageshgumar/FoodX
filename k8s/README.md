FoodX Kubernetes

Build images first:

docker build -t foodx-backend:latest ./backend
docker build -t foodx-frontend:latest ./frontend

Apply manifests:

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

Check status:

kubectl get pods -n foodx
kubectl get svc -n foodx

Open the app:

http://localhost:30080