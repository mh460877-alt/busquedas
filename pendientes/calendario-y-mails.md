# En revisión · Google Calendar y registro de contactos por mail

**Estado:** pendiente de decisión — no está construido
**Fecha:** 19 de agosto de 2026
**Pedido por:** Ayelén (mensajes del 10/8)
**Bloqueado por:** falta una definición (ver "Lo que necesito saber")

---

## 1 · Vincular el calendario con Google Calendar

### Lo que se pidió

> «¿Se puede vincular en calendario con Google Calendar de nuestra cuenta de Gmail?»

### Respuesta corta

Sí, en una dirección: **lo que se carga en el sistema aparece en Google Calendar.**

### Qué se puede hacer bien

Apps Script tiene acceso directo al calendario de la cuenta que publica el
sistema. Cada vez que se carga o se edita algo con fecha, se crea o se
actualiza el evento correspondiente:

- Pendientes y actividades
- Capacitaciones
- Viajes (salida y regreso)
- Permisos y licencias
- Inicio y cierre de proyectos
- Fechas estimadas de los pedidos de clientes

### Qué NO conviene hacer

**La vuelta: que lo cargado en Google entre al sistema.** Eso obliga a
sincronizar en dos direcciones y a resolver qué gana cuando el mismo evento
cambió de los dos lados. Se rompe seguido y ensucia los datos. Si algún día
hace falta, se resuelve distinto: con un calendario que el sistema solo lee,
nunca escribe.

### El detalle que hay que decidir

Los eventos van al calendario de **la cuenta que publicó el sistema**, no al de
cada persona. Apps Script corre con esa identidad y no puede escribir en el
calendario personal de cada una.

Para que todo el equipo los vea hay dos caminos:

| Camino | Cómo queda |
|---|---|
| **Calendario compartido del equipo** (recomendado) | Se crea uno, se comparte con todas, y el sistema escribe ahí. Cada una lo ve junto a su calendario propio. |
| Calendario de la cuenta que publica | Los eventos quedan en ese calendario y hay que compartirlo con las demás. Mezcla lo del sistema con lo personal de esa cuenta. |

### Lo que hace falta antes de construirlo

- Volver a autorizar el script con permisos de Calendar.
- Decidir cuál de los dos caminos.
- Si es calendario compartido: crearlo y pasarme su identificador.

---

## 2 · Registro de contactos con empresas y envío de mails

### Lo que se pidió

> «Que el contacto con las empresas con las que trabajamos quede en registro de
> la plataforma y los envíos de mail, vincularlos al mail corporativo.»

Son dos cosas y conviene separarlas, porque una es simple y la otra no.

### 2a · Registro de contactos — sin obstáculos

Cada llamada, reunión o mail con un cliente queda anotado en su ficha, con
fecha, tipo y quién lo hizo. Es la misma mecánica que ya funciona en la
conversación de los pedidos, aplicada a la ficha de la empresa.

No necesita permisos nuevos ni decisiones previas. **Se puede construir cuando
se quiera.**

### 2b · Enviar mails desde el sistema — con una condición

También se puede. Los mails salen del correo de la cuenta que publica el
servicio, y quedan registrados en la ficha del cliente igual que el resto de
los contactos.

La condición es de qué cuenta se trata:

| Si el sistema está publicado desde… | Los mails salen de | Límite diario |
|---|---|---|
| Una cuenta **@escencialconsult.com.ar** (Workspace) | Ese correo corporativo | 1.500 |
| Un **Gmail común** | Ese Gmail | 100 |

Un límite de 100 por día alcanza para avisos puntuales, no para envíos masivos.

### Lo que hace falta antes de construirlo

- Volver a autorizar el script con permisos de Gmail.
- Saber desde qué cuenta está publicado el sistema.

---

## Lo que necesito saber para avanzar

1. **¿Desde qué cuenta está publicado el sistema?** ¿Es una cuenta del dominio
   `@escencialconsult.com.ar` o un Gmail común? De eso depende si los mails
   salen del correo corporativo y cuántos se pueden mandar por día.

2. **Para el calendario: ¿calendario compartido del equipo, o el de la cuenta
   que publica?**

3. **¿Se construyen las dos cosas, o solo una?** El registro de contactos (2a)
   se puede hacer ya mismo, sin esperar nada.

---

## Lo que hay que tener en cuenta antes de decidir

Las tres funciones —archivos, calendario y mails— le dan al sistema permisos
que hoy no tiene: **tocar el Drive, el calendario y mandar mails en nombre de
la cuenta que lo publica.**

El sistema está publicado como *"cualquiera puede acceder"* y ejecuta con los
permisos de esa cuenta. La capa de seguridad lo controla bien y está probada
—los intentos de saltearla desde afuera fueron rechazados—, pero de acá en
adelante un error costaría más caro: ya no serían solo datos de una planilla.

No es una razón para no hacerlo. Es una razón para hacerlo de a una cosa por
vez, probando cada una antes de seguir con la siguiente.

---

## Estado de las tres funciones pedidas el 10/8

| | Estado |
|---|---|
| Adjuntar archivos | ✅ **Construido.** Falta autorizar Drive y publicar. |
| Google Calendar | ⏸ En revisión — este documento |
| Registro de contactos | ⏸ Listo para construir, no necesita decisiones |
| Envío de mails | ⏸ En revisión — depende de qué cuenta publica |
