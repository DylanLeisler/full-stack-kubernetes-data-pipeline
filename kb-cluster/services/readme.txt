'nginx-deployment-service.yaml' is a YAML output of a service that was created via the kubectl 'expose' command.

If using minikube, it will not be accessible from outside the cluster -- I.E. the localhost -- unless it is made accessible by minikube. This can be accomplished with the following command:

minikube service {service-name} --url
