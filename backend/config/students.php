<?php

return [
    'table' => env('STUDENTS_TABLE', 'students'),
    'cloud_connection' => 'pgsql',
    'physical_connection' => 'local_mysql',
];
