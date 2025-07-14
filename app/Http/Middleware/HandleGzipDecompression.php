<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class HandleGzipDecompression
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('Gzip middleware invoked', [
            'url' => $request->url(),
            'method' => $request->method(),
            'has_content_encoding' => $request->hasHeader('Content-Encoding'),
            'content_encoding' => $request->header('Content-Encoding'),
            'content_length' => strlen($request->getContent()),
            'has_content' => !empty($request->getContent())
        ]);

        // Check if the request has gzip encoding
        if ($request->header('Content-Encoding') === 'gzip') {
            // Get the raw content
            $compressedContent = $request->getContent();
            
            Log::info('Gzip middleware: Processing compressed request', [
                'content_length' => strlen($compressedContent),
                'first_20_bytes' => bin2hex(substr($compressedContent, 0, 20)),
                'url' => $request->url()
            ]);
            
            if (!empty($compressedContent)) {
                // Try different decompression methods
                $decompressedContent = false;
                $method = '';
                
                // Method 1: gzdecode (handles full gzip format)
                $decompressedContent = @gzdecode($compressedContent);
                if ($decompressedContent !== false) {
                    $method = 'gzdecode';
                }
                
                // Method 2: fallback with gzinflate if gzdecode fails
                if ($decompressedContent === false) {
                    $decompressedContent = @gzinflate(substr($compressedContent, 10, -8));
                    if ($decompressedContent !== false) {
                        $method = 'gzinflate';
                    }
                }
                
                // Method 3: another fallback
                if ($decompressedContent === false) {
                    $decompressedContent = @gzuncompress($compressedContent);
                    if ($decompressedContent !== false) {
                        $method = 'gzuncompress';
                    }
                }
                
                Log::info('Gzip decompression result', [
                    'success' => $decompressedContent !== false,
                    'method' => $method,
                    'decompressed_length' => $decompressedContent ? strlen($decompressedContent) : 0,
                    'decompressed_preview' => $decompressedContent ? substr($decompressedContent, 0, 200) : null
                ]);
                
                if ($decompressedContent !== false) {
                    // Parse JSON data
                    $jsonData = json_decode($decompressedContent, true);
                    
                    Log::info('JSON parsing result', [
                        'json_valid' => $jsonData !== null,
                        'json_error' => json_last_error_msg(),
                        'parsed_keys' => $jsonData ? array_keys($jsonData) : null
                    ]);
                    
                    if ($jsonData !== null) {
                        // Create a new request instance with the decompressed data
                        $newRequest = $request->duplicate();
                        $newRequest->headers->remove('Content-Encoding');
                        $newRequest->replace($jsonData);
                        
                        // Override the original request content
                        $newRequest->initialize(
                            $newRequest->query->all(),
                            $jsonData, // Use parsed JSON as request data
                            $newRequest->attributes->all(),
                            $newRequest->cookies->all(),
                            $newRequest->files->all(),
                            $newRequest->server->all(),
                            $decompressedContent
                        );
                        
                        Log::info('Request modified successfully', [
                            'new_request_data' => $jsonData
                        ]);
                        
                        // Replace the current request
                        app()->instance('request', $newRequest);
                        
                        return $next($newRequest);
                    } else {
                        Log::warning('Failed to parse JSON from decompressed data');
                    }
                } else {
                    Log::warning('Failed to decompress gzip data');
                }
            }
        }

        return $next($request);
    }
}