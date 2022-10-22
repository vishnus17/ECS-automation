FROM ubuntu:latest

# install apache2

RUN apt-get update && apt-get install -y apache2


# tell the port number the container should expose
EXPOSE 80

# run apache2
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
