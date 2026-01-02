**Odak:** Sistemin teknik motoru ve veri işleme.

Sistem bağımsız mikroservislere (Sipariş Alım, Envanter, Sourcing, Ödeme) bölünür. Kafka/RabbitMQ ile olay güdümlü (Event-Driven) asenkron haberleşme sağlanır. CQRS ile okuma (Query) ve yazma (Command) modelleri performans için ayrıştırılır.
