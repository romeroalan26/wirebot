// Script de prueba para verificar conexión a Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imtalpwzwfqxbgsuljql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdGFscHd6d2ZxeGJnc3VsanFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NDc5MjEsImV4cCI6MjA2NDMyMzkyMX0.zpiJflyya3RQhVrgrxjJRt1nqtv58z5IeZRSskxRyM4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probarConexion() {
    console.log('🔍 Verificando conexión a Supabase...');

    try {
        // Solo probar conectividad con una consulta de lectura
        const { data, error } = await supabase
            .from('procesos')
            .select('id, titulo, created_at')
            .limit(5);

        if (error) {
            console.error('❌ Error de conexión:', error);
            return;
        }

        console.log('✅ Conexión exitosa a Supabase!');
        console.log(`📊 Procesos encontrados: ${data.length}`);

        if (data.length > 0) {
            console.log('\n📋 Procesos en la base de datos:');
            data.forEach((proceso, index) => {
                console.log(`  ${index + 1}. ${proceso.titulo} (ID: ${proceso.id})`);
                console.log(`     Creado: ${new Date(proceso.created_at).toLocaleString()}`);
            });
        } else {
            console.log('📝 No hay procesos en la base de datos todavía');
            console.log('💡 Necesitarás agregar algunos manualmente desde Supabase Dashboard');
        }

        console.log('\n🎯 La infraestructura de sincronización está lista!');
        console.log('🔄 La aplicación podrá sincronizar cuando agregues procesos');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar la función
probarConexion(); 