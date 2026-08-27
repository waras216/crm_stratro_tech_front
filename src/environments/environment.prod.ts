export const environment = {
    production: true,
    // Reemplazar antes de buildear: IP pública o dominio de la VM (OCI/EC2)
    // que sirve api_nginx. Ej: 'http://<ip-oci>.nip.io:8001/api' o
    // 'https://<dominio>/api' si se configuró Certbot.
    apiUrl: 'https://apistratohub.strato-tech-solutions.com/api'
}
